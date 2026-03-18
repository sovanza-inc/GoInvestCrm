from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import bcrypt

from database import db
from auth import get_current_user
from models import ProfileUpdate, PasswordChange

router = APIRouter(prefix="/profile")


@router.get("")
async def get_profile(user=Depends(get_current_user)):
    """Get current user profile with statistics"""
    user_data = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password': 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get statistics
    leads_count = await db.leads.count_documents({'user_id': user['id']})
    conversations_count = await db.conversations.count_documents({'user_id': user['id']})
    
    # Get team info if user is part of a team
    team_members = []
    if user_data.get('team_id'):
        team_members = await db.users.find(
            {'team_id': user_data['team_id']},
            {'_id': 0, 'id': 1, 'name': 1, 'email': 1, 'role': 1, 'avatar': 1}
        ).to_list(None)
    
    return {
        **user_data,
        'statistics': {
            'leads_count': leads_count,
            'conversations_count': conversations_count,
            'team_size': len(team_members)
        },
        'team_members': team_members
    }


@router.put("")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    """Update user profile"""
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {'id': user['id']},
        {'$set': update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password': 0})
    return updated_user


@router.put("/password")
async def change_password(data: PasswordChange, user=Depends(get_current_user)):
    """Change user password"""
    user_data = await db.users.find_one({'id': user['id']})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(data.current_password.encode('utf-8'), user_data['password'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update password
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {'password': new_hashed, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {'message': 'Password changed successfully'}
