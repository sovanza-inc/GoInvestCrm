from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid
import random

from database import db
from auth import get_current_user
from models import MessageCreate

router = APIRouter(prefix="/conversations")


@router.get("")
async def get_conversations(
    user=Depends(get_current_user), platform: Optional[str] = None,
    status: Optional[str] = None, starred: Optional[bool] = None,
    search: Optional[str] = None
):
    query = {'user_id': user['id']}
    if platform:
        query['platform'] = platform
    if status:
        query['status'] = status
    if starred is not None:
        query['starred'] = starred
    if search:
        query['$or'] = [
            {'lead_name': {'$regex': search, '$options': 'i'}},
            {'lead_handle': {'$regex': search, '$options': 'i'}}
        ]
    conversations = await db.conversations.find(query, {'_id': 0}).sort('last_message_at', -1).to_list(100)
    return {'conversations': conversations}


@router.get("/{conv_id}")
async def get_conversation(conv_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({'id': conv_id, 'user_id': user['id']}, {'_id': 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await db.messages.find({'conversation_id': conv_id}, {'_id': 0}).sort('timestamp', 1).to_list(500)
    return {'conversation': conv, 'messages': messages}


@router.post("/{conv_id}/messages")
async def send_message(conv_id: str, data: MessageCreate, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({'id': conv_id, 'user_id': user['id']})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    msg_doc = {
        'id': msg_id, 'conversation_id': conv_id, 'sender': 'user',
        'content': data.content, 'timestamp': now, 'ai_generated': False
    }
    await db.messages.insert_one(msg_doc)
    await db.conversations.update_one(
        {'id': conv_id},
        {'$set': {'last_message': data.content, 'last_message_at': now, 'status': 'active'}}
    )
    msg_doc.pop('_id', None)
    return msg_doc


@router.put("/{conv_id}/star")
async def toggle_star(conv_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({'id': conv_id, 'user_id': user['id']})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    new_starred = not conv.get('starred', False)
    await db.conversations.update_one({'id': conv_id}, {'$set': {'starred': new_starred}})
    return {'starred': new_starred}
