from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user
from models import LeadCreate, LeadUpdate

router = APIRouter(prefix="/leads")


@router.get("")
async def get_leads(
    user=Depends(get_current_user),
    status: Optional[str] = None, platform: Optional[str] = None,
    min_score: Optional[int] = None, max_score: Optional[int] = None,
    search: Optional[str] = None, tag: Optional[str] = None,
    sort_by: Optional[str] = "created_at", sort_order: Optional[str] = "desc",
    limit: int = 50, offset: int = 0
):
    query = {'user_id': user['id']}
    if status:
        query['status'] = status
    if platform:
        query['platform'] = platform
    if min_score is not None or max_score is not None:
        score_q = {}
        if min_score is not None:
            score_q['$gte'] = min_score
        if max_score is not None:
            score_q['$lte'] = max_score
        query['score'] = score_q
    if tag:
        query['tags'] = {'$in': [tag]}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'handle': {'$regex': search, '$options': 'i'}}
        ]
    sort_dir = -1 if sort_order == 'desc' else 1
    leads = await db.leads.find(query, {'_id': 0}).sort(sort_by, sort_dir).skip(offset).limit(limit).to_list(limit)
    total = await db.leads.count_documents(query)
    return {'leads': leads, 'total': total}


@router.post("")
async def create_lead(data: LeadCreate, user=Depends(get_current_user)):
    lead_id = str(uuid.uuid4())
    score = min(100, int(data.engagement_rate * 20 + min(data.followers / 1000, 50)))
    lead_doc = {
        'id': lead_id, 'user_id': user['id'], 'name': data.name, 'handle': data.handle,
        'platform': data.platform, 'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.handle}",
        'bio': data.bio or '', 'followers': data.followers, 'engagement_rate': data.engagement_rate,
        'score': score, 'status': 'new', 'tags': data.tags, 'notes': data.notes or '',
        'last_contacted': None, 'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(lead_doc)
    lead_doc.pop('_id', None)
    return lead_doc


@router.get("/{lead_id}")
async def get_lead(lead_id: str, user=Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'user_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}")
async def update_lead(lead_id: str, data: LeadUpdate, user=Depends(get_current_user)):
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.leads.update_one({'id': lead_id, 'user_id': user['id']}, {'$set': update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    return lead


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, user=Depends(get_current_user)):
    result = await db.leads.delete_one({'id': lead_id, 'user_id': user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {'message': 'Lead deleted'}
