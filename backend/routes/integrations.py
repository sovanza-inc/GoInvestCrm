from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user
from models import IntegrationConnect, IntegrationMessage

router = APIRouter(prefix="/integrations")

SUPPORTED_PLATFORMS = ['whatsapp', 'instagram', 'linkedin']


@router.get("")
async def get_integrations(user=Depends(get_current_user)):
    integrations = await db.integrations.find(
        {'user_id': user['id']}, {'_id': 0}
    ).to_list(20)
    return {'integrations': integrations}


@router.post("/connect")
async def connect_integration(data: IntegrationConnect, user=Depends(get_current_user)):
    if data.platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {data.platform}")

    existing = await db.integrations.find_one({
        'user_id': user['id'], 'platform': data.platform
    })
    if existing:
        raise HTTPException(status_code=400, detail=f"{data.platform} is already connected")

    now = datetime.now(timezone.utc).isoformat()
    integration_doc = {
        'id': str(uuid.uuid4()),
        'user_id': user['id'],
        'platform': data.platform,
        'account_name': data.account_name or f"My {data.platform.title()} Account",
        'account_id': data.account_id or '',
        'status': 'connected',
        'connected_at': now,
        'last_synced': now,
        'stats': {
            'messages_sent': 0,
            'messages_received': 0,
            'conversations': 0,
        },
    }

    await db.integrations.insert_one(integration_doc)
    integration_doc.pop('_id', None)
    return integration_doc


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str, user=Depends(get_current_user)):
    result = await db.integrations.delete_one({
        'id': integration_id, 'user_id': user['id']
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integration not found")
    return {'message': 'Integration disconnected'}


@router.get("/{platform}/conversations")
async def get_platform_conversations(
    platform: str,
    user=Depends(get_current_user),
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    integration = await db.integrations.find_one({
        'user_id': user['id'], 'platform': platform
    })
    if not integration:
        raise HTTPException(status_code=400, detail=f"{platform} is not connected")

    query = {'user_id': user['id'], 'platform': platform}
    if search:
        query['$or'] = [
            {'contact_name': {'$regex': search, '$options': 'i'}},
            {'last_message': {'$regex': search, '$options': 'i'}},
        ]
    if status:
        query['status'] = status

    conversations = await db.platform_conversations.find(
        query, {'_id': 0}
    ).sort('last_message_at', -1).to_list(100)

    return {'conversations': conversations, 'total': len(conversations)}


@router.get("/{platform}/conversations/{conv_id}")
async def get_platform_conversation(
    platform: str, conv_id: str, user=Depends(get_current_user)
):
    conv = await db.platform_conversations.find_one(
        {'id': conv_id, 'user_id': user['id'], 'platform': platform}, {'_id': 0}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await db.platform_messages.find(
        {'conversation_id': conv_id}, {'_id': 0}
    ).sort('timestamp', 1).to_list(500)

    return {'conversation': conv, 'messages': messages}


@router.post("/{platform}/conversations/{conv_id}/send")
async def send_platform_message(
    platform: str, conv_id: str, data: IntegrationMessage,
    user=Depends(get_current_user)
):
    conv = await db.platform_conversations.find_one(
        {'id': conv_id, 'user_id': user['id'], 'platform': platform}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    msg_doc = {
        'id': str(uuid.uuid4()),
        'conversation_id': conv_id,
        'sender': 'user',
        'content': data.content,
        'timestamp': now,
        'status': 'sent',
    }
    await db.platform_messages.insert_one(msg_doc)
    msg_doc.pop('_id', None)

    # Update conversation
    await db.platform_conversations.update_one(
        {'id': conv_id},
        {'$set': {
            'last_message': data.content,
            'last_message_at': now,
            'status': 'active',
        }}
    )

    # Update integration stats
    await db.integrations.update_one(
        {'user_id': user['id'], 'platform': platform},
        {'$inc': {'stats.messages_sent': 1}}
    )

    # Simulate a reply after a brief delay (for demo)
    import random
    replies = [
        "Thanks for reaching out! Let me check on that.",
        "Hi! I'd love to learn more about your services.",
        "That sounds great, can you send me more details?",
        "Sure, I'm interested. What are the next steps?",
        "Let me think about it and get back to you.",
    ]
    reply_doc = {
        'id': str(uuid.uuid4()),
        'conversation_id': conv_id,
        'sender': 'contact',
        'content': random.choice(replies),
        'timestamp': now,
        'status': 'delivered',
    }
    await db.platform_messages.insert_one(reply_doc)
    reply_doc.pop('_id', None)

    await db.integrations.update_one(
        {'user_id': user['id'], 'platform': platform},
        {'$inc': {'stats.messages_received': 1}}
    )

    return {'sent': msg_doc, 'reply': reply_doc}


@router.post("/{platform}/seed-demo")
async def seed_demo_conversations(platform: str, user=Depends(get_current_user)):
    """Create demo conversations for a connected platform"""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    integration = await db.integrations.find_one({
        'user_id': user['id'], 'platform': platform
    })
    if not integration:
        raise HTTPException(status_code=400, detail=f"{platform} is not connected")

    import random
    now = datetime.now(timezone.utc).isoformat()

    demo_contacts = [
        {"name": "Sarah Johnson", "handle": "@sarah_j"},
        {"name": "Mike Chen", "handle": "@mikechen"},
        {"name": "Emma Wilson", "handle": "@emma.w"},
        {"name": "Alex Rivera", "handle": "@alex_r"},
        {"name": "Priya Sharma", "handle": "@priya.s"},
    ]

    demo_messages_map = [
        ["Hey! I saw your product and I'm curious.", "Thanks for reaching out! Happy to help."],
        ["Can you tell me about pricing?", "Sure! We have plans starting at $29/mo."],
        ["I need help with my account.", "Of course, what seems to be the issue?"],
        ["Love your content! Do you offer consulting?", "Yes we do! Let me send you details."],
        ["Is there a free trial available?", "Absolutely! 14 days, no card required."],
    ]

    created = 0
    for i, contact in enumerate(demo_contacts):
        conv_id = str(uuid.uuid4())
        msgs = demo_messages_map[i]

        conv_doc = {
            'id': conv_id,
            'user_id': user['id'],
            'platform': platform,
            'contact_name': contact['name'],
            'contact_handle': contact['handle'],
            'contact_avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={contact['handle']}",
            'last_message': msgs[-1],
            'last_message_at': now,
            'status': random.choice(['active', 'pending', 'resolved']),
            'unread': random.randint(0, 3),
            'created_at': now,
        }
        await db.platform_conversations.insert_one(conv_doc)

        for j, msg_text in enumerate(msgs):
            msg_doc = {
                'id': str(uuid.uuid4()),
                'conversation_id': conv_id,
                'sender': 'contact' if j % 2 == 0 else 'user',
                'content': msg_text,
                'timestamp': now,
                'status': 'delivered',
            }
            await db.platform_messages.insert_one(msg_doc)
        created += 1

    await db.integrations.update_one(
        {'id': integration['id']},
        {'$set': {'stats.conversations': created, 'last_synced': now}}
    )

    return {'message': f'Created {created} demo conversations for {platform}', 'count': created}
