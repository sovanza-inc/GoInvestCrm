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
    user=Depends(get_current_user), 
    platform: Optional[str] = None,
    status: Optional[str] = None, 
    starred: Optional[bool] = None,
    search: Optional[str] = None,
    assigned_to: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: Optional[str] = "last_message_at",
    sort_order: Optional[str] = "desc"
):
    query = {'user_id': user['id']}
    
    if platform:
        query['platform'] = platform
    if status:
        query['status'] = status
    if starred is not None:
        query['starred'] = starred
    if assigned_to:
        query['assigned_to'] = assigned_to
    
    # Date range filter
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query['$gte'] = date_from
        if date_to:
            date_query['$lte'] = date_to
        if date_query:
            query['last_message_at'] = date_query
    
    # Search in conversation details
    if search:
        query['$or'] = [
            {'lead_name': {'$regex': search, '$options': 'i'}},
            {'lead_handle': {'$regex': search, '$options': 'i'}},
            {'last_message': {'$regex': search, '$options': 'i'}}
        ]
    
    # Sort direction
    sort_dir = -1 if sort_order == 'desc' else 1
    
    conversations = await db.conversations.find(query, {'_id': 0}).sort(sort_by, sort_dir).to_list(200)
    total = await db.conversations.count_documents(query)
    
    return {
        'conversations': conversations,
        'total': total,
        'filters_applied': {
            'platform': platform,
            'status': status,
            'starred': starred,
            'search': search,
            'assigned_to': assigned_to,
            'date_from': date_from,
            'date_to': date_to
        }
    }


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
