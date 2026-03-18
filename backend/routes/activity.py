from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user

router = APIRouter(prefix="/activity")


async def log_activity(user_id: str, user_name: str, action: str, entity_type: str, entity_id: str = "", details: str = ""):
    """Helper to log an activity. Call from any route."""
    doc = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'user_name': user_name,
        'action': action,
        'entity_type': entity_type,
        'entity_id': entity_id,
        'details': details,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    await db.activity_log.insert_one(doc)


@router.get("/log")
async def get_activity_log(
    user=Depends(get_current_user),
    limit: int = 50,
    entity_type: Optional[str] = None,
    member_id: Optional[str] = None,
):
    """Get activity log for the team"""
    user_data = await db.users.find_one({'id': user['id']})
    team_id = user_data.get('team_id') or user['id']

    # Get all team member IDs
    team_members = await db.users.find({'team_id': team_id}, {'id': 1, '_id': 0}).to_list(100)
    member_ids = [m['id'] for m in team_members]
    if user['id'] not in member_ids:
        member_ids.append(user['id'])

    query = {'user_id': {'$in': member_ids}}
    if entity_type:
        query['entity_type'] = entity_type
    if member_id:
        query['user_id'] = member_id

    activities = await db.activity_log.find(
        query, {'_id': 0}
    ).sort('timestamp', -1).limit(limit).to_list(limit)

    return {'activities': activities, 'total': len(activities)}


@router.get("/team-performance")
async def get_team_performance(user=Depends(get_current_user)):
    """Get performance stats for each team member"""
    user_data = await db.users.find_one({'id': user['id']})
    team_id = user_data.get('team_id') or user['id']

    members = await db.users.find(
        {'team_id': team_id},
        {'_id': 0, 'id': 1, 'name': 1, 'email': 1, 'role': 1, 'avatar': 1}
    ).to_list(50)

    if not members:
        members = [{'id': user['id'], 'name': user_data.get('name', 'You'), 'email': user_data.get('email'), 'role': 'admin', 'avatar': user_data.get('avatar', '')}]

    performance = []
    for member in members:
        mid = member['id']

        # Count leads assigned
        leads_count = await db.leads.count_documents({'assigned_to_id': mid})
        if leads_count == 0:
            leads_count = await db.leads.count_documents({'user_id': mid})

        # Count conversations handled
        convs_count = await db.conversations.count_documents({'user_id': mid})

        # Count messages sent
        msgs_count = await db.messages.count_documents({'sender': 'user', 'conversation_id': {'$exists': True}})

        # Count activities
        activities_count = await db.activity_log.count_documents({'user_id': mid})

        # Count leads by status for this member
        closed_leads = await db.leads.count_documents({
            '$or': [{'assigned_to_id': mid}, {'user_id': mid}],
            'status': 'closed'
        })

        performance.append({
            'id': mid,
            'name': member.get('name', 'Unknown'),
            'email': member.get('email', ''),
            'role': member.get('role', 'agent'),
            'avatar': member.get('avatar', ''),
            'stats': {
                'leads_handled': leads_count,
                'conversations': convs_count,
                'messages_sent': msgs_count,
                'activities': activities_count,
                'deals_closed': closed_leads,
            }
        })

    return {'members': performance}
