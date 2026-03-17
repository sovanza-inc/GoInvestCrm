from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user
from models import TemplateCreate, TemplateUpdate

router = APIRouter(prefix="/templates")


@router.get("")
async def get_templates(user=Depends(get_current_user), category: Optional[str] = None, search: Optional[str] = None):
    query = {'user_id': user['id']}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [{'name': {'$regex': search, '$options': 'i'}}, {'content': {'$regex': search, '$options': 'i'}}]
    templates = await db.templates.find(query, {'_id': 0}).sort('usage_count', -1).to_list(100)
    return {'templates': templates}


@router.post("")
async def create_template(data: TemplateCreate, user=Depends(get_current_user)):
    t_id = str(uuid.uuid4())
    doc = {'id': t_id, 'user_id': user['id'], 'name': data.name, 'content': data.content,
           'category': data.category, 'tags': data.tags, 'usage_count': 0,
           'created_at': datetime.now(timezone.utc).isoformat()}
    await db.templates.insert_one(doc)
    doc.pop('_id', None)
    return doc


@router.put("/{template_id}")
async def update_template(template_id: str, data: TemplateUpdate, user=Depends(get_current_user)):
    ud = {k: v for k, v in data.model_dump().items() if v is not None}
    if not ud:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.templates.update_one({'id': template_id, 'user_id': user['id']}, {'$set': ud})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    t = await db.templates.find_one({'id': template_id}, {'_id': 0})
    return t


@router.delete("/{template_id}")
async def delete_template(template_id: str, user=Depends(get_current_user)):
    r = await db.templates.delete_one({'id': template_id, 'user_id': user['id']})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {'message': 'Template deleted'}
