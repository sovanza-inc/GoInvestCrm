from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta

from database import db
from auth import get_current_user

router = APIRouter(prefix="/analytics")


@router.get("/overview")
async def get_analytics_overview(user=Depends(get_current_user)):
    uid = user['id']
    total_leads = await db.leads.count_documents({'user_id': uid})
    qualified_leads = await db.leads.count_documents({'user_id': uid, 'score': {'$gte': 60}})
    active_convos = await db.conversations.count_documents({'user_id': uid, 'status': 'active'})
    total_convos = await db.conversations.count_documents({'user_id': uid})
    closed_convos = await db.conversations.count_documents({'user_id': uid, 'status': 'closed'})
    conversion_rate = round((closed_convos / max(total_convos, 1)) * 100, 1)
    hot = await db.leads.count_documents({'user_id': uid, 'score': {'$gte': 70}})
    warm = await db.leads.count_documents({'user_id': uid, 'score': {'$gte': 40, '$lt': 70}})
    cold = await db.leads.count_documents({'user_id': uid, 'score': {'$lt': 40}})
    return {
        'total_leads': total_leads, 'qualified_leads': qualified_leads,
        'active_conversations': active_convos, 'total_conversations': total_convos,
        'closed_conversations': closed_convos, 'conversion_rate': conversion_rate,
        'hot_leads': hot, 'warm_leads': warm, 'cold_leads': cold
    }


@router.get("/pipeline")
async def get_analytics_pipeline(user=Depends(get_current_user)):
    uid = user['id']
    stages = ['new', 'contacted', 'qualified', 'negotiation', 'closed', 'lost']
    pipeline = {}
    for s in stages:
        pipeline[s] = await db.leads.count_documents({'user_id': uid, 'status': s})
    platforms = ['instagram', 'facebook', 'linkedin', 'twitter']
    platform_dist = {}
    for p in platforms:
        platform_dist[p] = await db.leads.count_documents({'user_id': uid, 'platform': p})
    monthly = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        ms = (now - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0).isoformat()
        me = (now - timedelta(days=30*(i-1))).replace(day=1, hour=0, minute=0, second=0).isoformat() if i > 0 else now.isoformat()
        c = await db.leads.count_documents({'user_id': uid, 'created_at': {'$gte': ms, '$lt': me}})
        ml = (now - timedelta(days=30*i)).strftime('%b')
        monthly.append({'month': ml, 'leads': c})
    return {'pipeline': pipeline, 'platform_distribution': platform_dist, 'monthly_data': monthly}
