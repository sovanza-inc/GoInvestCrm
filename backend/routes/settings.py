from fastapi import APIRouter, Depends

from database import db
from auth import get_current_user

router = APIRouter(prefix="/settings")


@router.get("")
async def get_settings(user=Depends(get_current_user)):
    s = await db.settings.find_one({'user_id': user['id']}, {'_id': 0})
    if not s:
        s = {'user_id': user['id'], 'notifications_enabled': True, 'auto_score': True,
             'daily_outreach_limit': 50, 'connected_accounts': []}
        await db.settings.insert_one(s)
        s.pop('_id', None)
    return s


@router.put("")
async def update_settings(data: dict, user=Depends(get_current_user)):
    data.pop('_id', None)
    data.pop('user_id', None)
    await db.settings.update_one({'user_id': user['id']}, {'$set': data}, upsert=True)
    s = await db.settings.find_one({'user_id': user['id']}, {'_id': 0})
    return s
