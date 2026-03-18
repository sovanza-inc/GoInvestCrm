from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid
import bcrypt

from database import db
from auth import get_current_user
from models import TeamInvite, TeamMemberUpdate

router = APIRouter(prefix="/team")


@router.get("/members")
async def get_team_members(user=Depends(get_current_user)):
    """Get all team members"""
    user_data = await db.users.find_one({'id': user['id']})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    team_id = user_data.get('team_id') or user['id']  # Use user's own ID as team_id if not set
    
    members = await db.users.find(
        {'team_id': team_id},
        {'_id': 0, 'id': 1, 'name': 1, 'email': 1, 'role': 1, 'avatar': 1, 'created_at': 1, 'last_login': 1}
    ).to_list(None)
    
    return {'members': members, 'team_id': team_id}


@router.post("/invite")
async def invite_team_member(data: TeamInvite, user=Depends(get_current_user)):
    """Invite a new team member"""
    user_data = await db.users.find_one({'id': user['id']})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admins can invite
    if user_data.get('role') not in ['admin', None]:  # None means original owner
        raise HTTPException(status_code=403, detail="Only admins can invite team members")
    
    # Check if email already exists
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create team_id if it doesn't exist
    team_id = user_data.get('team_id') or user['id']
    
    # Update current user's team_id if not set
    if not user_data.get('team_id'):
        await db.users.update_one(
            {'id': user['id']},
            {'$set': {'team_id': team_id, 'role': 'admin'}}
        )
    
    # Generate temporary password
    temp_password = f"temp_{uuid.uuid4().hex[:8]}"
    hashed = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new team member
    member_id = str(uuid.uuid4())
    member_doc = {
        'id': member_id,
        'email': data.email,
        'password': hashed,
        'name': data.name or data.email.split('@')[0],
        'company': user_data.get('company', ''),
        'role': data.role,
        'team_id': team_id,
        'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.email}",
        'subscription': {'plan': 'team', 'status': 'active'},
        'trial_ends_at': user_data.get('trial_ends_at'),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'last_login': None
    }
    
    await db.users.insert_one(member_doc)
    member_doc.pop('_id', None)
    member_doc.pop('password', None)
    
    # In production, send email with temp password
    return {
        **member_doc,
        'temp_password': temp_password,
        'message': 'Team member invited successfully. Send them the temporary password.'
    }


@router.put("/members/{member_id}")
async def update_team_member(member_id: str, data: TeamMemberUpdate, user=Depends(get_current_user)):
    """Update team member role"""
    user_data = await db.users.find_one({'id': user['id']})
    
    if not user_data or user_data.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update team members")
    
    team_id = user_data.get('team_id')
    
    # Verify member belongs to same team
    member = await db.users.find_one({'id': member_id, 'team_id': team_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Update role
    await db.users.update_one(
        {'id': member_id},
        {'$set': {'role': data.role}}
    )
    
    updated = await db.users.find_one({'id': member_id}, {'_id': 0, 'password': 0})
    return updated


@router.delete("/members/{member_id}")
async def remove_team_member(member_id: str, user=Depends(get_current_user)):
    """Remove team member"""
    user_data = await db.users.find_one({'id': user['id']})
    
    if not user_data or user_data.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can remove team members")
    
    team_id = user_data.get('team_id')
    
    # Verify member belongs to same team
    member = await db.users.find_one({'id': member_id, 'team_id': team_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Don't allow removing the admin (self)
    if member_id == user['id']:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    
    # Delete member
    await db.users.delete_one({'id': member_id})
    
    return {'message': 'Team member removed successfully'}
