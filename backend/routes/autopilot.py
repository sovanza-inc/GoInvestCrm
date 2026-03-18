from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user
from models import (
    CampaignCreate, CampaignUpdate, CampaignStepCreate
)

router = APIRouter(prefix="/autopilot")


@router.get("/campaigns")
async def get_campaigns(user=Depends(get_current_user)):
    campaigns = await db.campaigns.find(
        {'user_id': user['id']}, {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    return {'campaigns': campaigns}


@router.post("/campaigns")
async def create_campaign(data: CampaignCreate, user=Depends(get_current_user)):
    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    steps = []
    for i, step in enumerate(data.steps):
        steps.append({
            'id': str(uuid.uuid4()),
            'order': i,
            'message': step.message,
            'delay_hours': step.delay_hours,
            'variant': step.variant or 'A',
        })

    campaign_doc = {
        'id': campaign_id,
        'user_id': user['id'],
        'name': data.name,
        'description': data.description or '',
        'status': 'draft',
        'target_criteria': {
            'platforms': data.target_platforms or [],
            'statuses': data.target_statuses or [],
            'min_score': data.target_min_score,
            'max_score': data.target_max_score,
            'tags': data.target_tags or [],
        },
        'steps': steps,
        'stats': {
            'total_targeted': 0,
            'total_sent': 0,
            'total_replied': 0,
            'total_converted': 0,
        },
        'created_at': now,
        'updated_at': now,
    }

    await db.campaigns.insert_one(campaign_doc)
    campaign_doc.pop('_id', None)
    return campaign_doc


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user=Depends(get_current_user)):
    campaign = await db.campaigns.find_one(
        {'id': campaign_id, 'user_id': user['id']}, {'_id': 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get execution log
    executions = await db.campaign_executions.find(
        {'campaign_id': campaign_id}, {'_id': 0}
    ).sort('executed_at', -1).limit(50).to_list(50)

    return {'campaign': campaign, 'executions': executions}


@router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate, user=Depends(get_current_user)):
    campaign = await db.campaigns.find_one(
        {'id': campaign_id, 'user_id': user['id']}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_dict = {}
    if data.name is not None:
        update_dict['name'] = data.name
    if data.description is not None:
        update_dict['description'] = data.description
    if data.target_platforms is not None:
        update_dict['target_criteria.platforms'] = data.target_platforms
    if data.target_statuses is not None:
        update_dict['target_criteria.statuses'] = data.target_statuses
    if data.target_min_score is not None:
        update_dict['target_criteria.min_score'] = data.target_min_score
    if data.target_max_score is not None:
        update_dict['target_criteria.max_score'] = data.target_max_score
    if data.target_tags is not None:
        update_dict['target_criteria.tags'] = data.target_tags
    if data.steps is not None:
        steps = []
        for i, step in enumerate(data.steps):
            steps.append({
                'id': str(uuid.uuid4()),
                'order': i,
                'message': step.message,
                'delay_hours': step.delay_hours,
                'variant': step.variant or 'A',
            })
        update_dict['steps'] = steps

    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.campaigns.update_one(
            {'id': campaign_id}, {'$set': update_dict}
        )

    updated = await db.campaigns.find_one({'id': campaign_id}, {'_id': 0})
    return updated


@router.put("/campaigns/{campaign_id}/toggle")
async def toggle_campaign(campaign_id: str, user=Depends(get_current_user)):
    campaign = await db.campaigns.find_one(
        {'id': campaign_id, 'user_id': user['id']}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Must have at least one step to activate
    if campaign['status'] != 'active' and len(campaign.get('steps', [])) == 0:
        raise HTTPException(status_code=400, detail="Campaign needs at least one step to activate")

    new_status = 'active' if campaign['status'] != 'active' else 'paused'
    now = datetime.now(timezone.utc).isoformat()

    # When activating, count matching leads
    if new_status == 'active':
        criteria = campaign.get('target_criteria', {})
        query = {'user_id': user['id']}
        if criteria.get('platforms'):
            query['platform'] = {'$in': criteria['platforms']}
        if criteria.get('statuses'):
            query['status'] = {'$in': criteria['statuses']}
        if criteria.get('tags'):
            query['tags'] = {'$in': criteria['tags']}
        score_q = {}
        if criteria.get('min_score') is not None:
            score_q['$gte'] = criteria['min_score']
        if criteria.get('max_score') is not None:
            score_q['$lte'] = criteria['max_score']
        if score_q:
            query['score'] = score_q

        targeted = await db.leads.count_documents(query)
        await db.campaigns.update_one(
            {'id': campaign_id},
            {'$set': {
                'status': new_status,
                'activated_at': now,
                'updated_at': now,
                'stats.total_targeted': targeted,
            }}
        )
    else:
        await db.campaigns.update_one(
            {'id': campaign_id},
            {'$set': {'status': new_status, 'updated_at': now}}
        )

    updated = await db.campaigns.find_one({'id': campaign_id}, {'_id': 0})
    return updated


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user=Depends(get_current_user)):
    result = await db.campaigns.delete_one(
        {'id': campaign_id, 'user_id': user['id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.campaign_executions.delete_many({'campaign_id': campaign_id})
    return {'message': 'Campaign deleted'}


@router.post("/campaigns/{campaign_id}/simulate")
async def simulate_campaign(campaign_id: str, user=Depends(get_current_user)):
    """Simulate running the campaign to preview matching leads"""
    campaign = await db.campaigns.find_one(
        {'id': campaign_id, 'user_id': user['id']}, {'_id': 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    criteria = campaign.get('target_criteria', {})
    query = {'user_id': user['id']}
    if criteria.get('platforms'):
        query['platform'] = {'$in': criteria['platforms']}
    if criteria.get('statuses'):
        query['status'] = {'$in': criteria['statuses']}
    if criteria.get('tags'):
        query['tags'] = {'$in': criteria['tags']}
    score_q = {}
    if criteria.get('min_score') is not None:
        score_q['$gte'] = criteria['min_score']
    if criteria.get('max_score') is not None:
        score_q['$lte'] = criteria['max_score']
    if score_q:
        query['score'] = score_q

    matching_leads = await db.leads.find(query, {'_id': 0}).limit(20).to_list(20)
    total_matching = await db.leads.count_documents(query)

    return {
        'total_matching': total_matching,
        'preview_leads': matching_leads,
        'steps_count': len(campaign.get('steps', [])),
    }


@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(campaign_id: str, user=Depends(get_current_user)):
    campaign = await db.campaigns.find_one(
        {'id': campaign_id, 'user_id': user['id']}, {'_id': 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    stats = campaign.get('stats', {})
    steps = campaign.get('steps', [])

    # Build per-step analytics
    step_analytics = []
    for step in steps:
        execs = await db.campaign_executions.count_documents({
            'campaign_id': campaign_id,
            'step_id': step['id'],
        })
        replies = await db.campaign_executions.count_documents({
            'campaign_id': campaign_id,
            'step_id': step['id'],
            'replied': True,
        })
        step_analytics.append({
            'step_id': step['id'],
            'order': step['order'],
            'variant': step.get('variant', 'A'),
            'sent': execs,
            'replied': replies,
            'reply_rate': round(replies / execs * 100, 1) if execs > 0 else 0,
        })

    return {
        'campaign_id': campaign_id,
        'overall': stats,
        'steps': step_analytics,
    }
