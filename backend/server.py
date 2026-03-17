from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import random
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests as http_requests
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'gosocial-jwt-secret-2024')
JWT_ALGORITHM = 'HS256'
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Subscription Plans - amounts defined server-side for security
SUBSCRIPTION_PLANS = {
    "starter": {"name": "Starter", "price": 29.00, "leads_limit": 500, "ai_daily_limit": 10, "accounts_limit": 1, "team_limit": 1},
    "growth": {"name": "Growth", "price": 79.00, "leads_limit": 5000, "ai_daily_limit": -1, "accounts_limit": 5, "team_limit": 3},
    "enterprise": {"name": "Enterprise", "price": 199.00, "leads_limit": -1, "ai_daily_limit": -1, "accounts_limit": -1, "team_limit": -1},
}

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== Models ====================
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    company: Optional[str] = ""

class UserLogin(BaseModel):
    email: str
    password: str

class LeadCreate(BaseModel):
    name: str
    handle: str
    platform: str = "instagram"
    bio: Optional[str] = ""
    followers: int = 0
    engagement_rate: float = 0.0
    tags: List[str] = []
    notes: Optional[str] = ""

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    platform: Optional[str] = None
    bio: Optional[str] = None
    followers: Optional[int] = None
    engagement_rate: Optional[float] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None

class MessageCreate(BaseModel):
    content: str

class AISuggestRequest(BaseModel):
    conversation_id: str
    context: Optional[str] = ""

class AIScoreRequest(BaseModel):
    lead_id: str

class TemplateCreate(BaseModel):
    name: str
    content: str
    category: str = "general"
    tags: List[str] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class GoogleAuthRequest(BaseModel):
    session_id: str

# ==================== Auth Helpers ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {'user_id': user_id, 'exp': datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0, 'password_hash': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== Auth Endpoints ====================
@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id, 'email': data.email,
        'password_hash': hash_password(data.password),
        'name': data.name, 'company': data.company or '',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    # Set 7-day trial on Growth plan
    await db.users.update_one({'id': user_id}, {'$set': {
        'subscription': 'growth', 'subscription_status': 'trial',
        'trial_end': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }})
    return {'token': token, 'user': {'id': user_id, 'email': data.email, 'name': data.name, 'company': data.company or '', 'created_at': user_doc['created_at']}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user['id'])
    return {'token': token, 'user': {'id': user['id'], 'email': user['email'], 'name': user['name'], 'company': user.get('company', ''), 'created_at': user['created_at']}}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {'user': user}

# ==================== Google OAuth ====================
@api_router.post("/auth/google")
async def google_auth(data: GoogleAuthRequest):
    if not data.session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        resp = http_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google session")
        google_data = resp.json()
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=401, detail="Google authentication failed")

    email = google_data.get("email")
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        if picture and not existing.get("avatar"):
            await db.users.update_one({"id": existing["id"]}, {"$set": {"avatar": picture}})
        token = create_token(existing["id"])
        return {"token": token, "user": {
            "id": existing["id"], "email": existing["email"],
            "name": existing["name"], "company": existing.get("company", ""),
            "created_at": existing["created_at"]
        }}

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    trial_end = (now + timedelta(days=7)).isoformat()
    user_doc = {
        "id": user_id, "email": email, "password_hash": "",
        "name": name, "company": "", "avatar": picture,
        "auth_provider": "google",
        "subscription": "growth", "subscription_status": "trial",
        "trial_end": trial_end,
        "created_at": now.isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {"token": token, "user": {
        "id": user_id, "email": email, "name": name,
        "company": "", "created_at": user_doc["created_at"]
    }}

# ==================== Leads ====================
@api_router.get("/leads")
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

@api_router.post("/leads")
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

@api_router.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user=Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'user_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, data: LeadUpdate, user=Depends(get_current_user)):
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.leads.update_one({'id': lead_id, 'user_id': user['id']}, {'$set': update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    return lead

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user=Depends(get_current_user)):
    result = await db.leads.delete_one({'id': lead_id, 'user_id': user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {'message': 'Lead deleted'}

# ==================== Conversations ====================
@api_router.get("/conversations")
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

@api_router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({'id': conv_id, 'user_id': user['id']}, {'_id': 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await db.messages.find({'conversation_id': conv_id}, {'_id': 0}).sort('timestamp', 1).to_list(500)
    return {'conversation': conv, 'messages': messages}

@api_router.post("/conversations/{conv_id}/messages")
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

@api_router.put("/conversations/{conv_id}/star")
async def toggle_star(conv_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({'id': conv_id, 'user_id': user['id']})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    new_starred = not conv.get('starred', False)
    await db.conversations.update_one({'id': conv_id}, {'$set': {'starred': new_starred}})
    return {'starred': new_starred}

# ==================== AI Endpoints ====================
@api_router.post("/ai/suggest-reply")
async def suggest_reply(data: AISuggestRequest, user=Depends(get_current_user)):
    messages = await db.messages.find(
        {'conversation_id': data.conversation_id}, {'_id': 0}
    ).sort('timestamp', -1).limit(10).to_list(10)
    messages.reverse()
    conv = await db.conversations.find_one({'id': data.conversation_id}, {'_id': 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message_history = "\n".join([
        f"{'You' if m['sender'] == 'user' else conv.get('lead_name', 'Lead')}: {m['content']}"
        for m in messages
    ])

    if not EMERGENT_LLM_KEY:
        return {'suggestions': [
            {"tone": "casual", "message": "Hey! That sounds awesome. I'd love to explore this further with you - when works best for a quick chat?", "explanation": "Warm and approachable, shows genuine interest"},
            {"tone": "professional", "message": "Thank you for your interest. I'd be happy to walk you through our offering and discuss how it aligns with your goals.", "explanation": "Builds credibility and shows expertise"},
            {"tone": "direct", "message": "Great question! Here's exactly what we can do for you - let me share a quick breakdown of the value we deliver.", "explanation": "Gets straight to the point with clear value proposition"}
        ]}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"suggest-{uuid.uuid4()}",
            system_message="""You are a sales conversation assistant for social media DMs. 
Generate exactly 3 reply suggestions. Each with a different tone: casual, professional, and direct.
Return ONLY valid JSON array: [{"tone":"casual","message":"...","explanation":"..."},{"tone":"professional","message":"...","explanation":"..."},{"tone":"direct","message":"...","explanation":"..."}]"""
        )
        chat.with_model("openai", "gpt-5.2")
        prompt = f"Conversation with {conv.get('lead_name', 'prospect')} on {conv.get('platform', 'social media')}:\n\n{message_history}\n\n{f'Context: {data.context}' if data.context else ''}Generate 3 reply suggestions."
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = str(response)
        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start != -1 and end > start:
            suggestions = json.loads(response_text[start:end])
        else:
            suggestions = json.loads(response_text)
        return {'suggestions': suggestions}
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        return {'suggestions': [
            {"tone": "casual", "message": "Hey! That sounds awesome. Let's definitely explore this further!", "explanation": "Warm and approachable"},
            {"tone": "professional", "message": "Thank you for sharing. I'd love to discuss how we can help achieve your goals.", "explanation": "Professional and confidence-building"},
            {"tone": "direct", "message": "Great question! Here's what I can offer you specifically...", "explanation": "Direct value proposition"}
        ]}

@api_router.post("/ai/score-lead")
async def score_lead(data: AIScoreRequest, user=Depends(get_current_user)):
    lead = await db.leads.find_one({'id': data.lead_id, 'user_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not EMERGENT_LLM_KEY:
        score = min(100, int(lead.get('engagement_rate', 0) * 20 + min(lead.get('followers', 0) / 1000, 50)))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return {'score': score, 'reasoning': 'Scored based on engagement rate and follower count', 'category': 'hot' if score >= 70 else 'warm' if score >= 40 else 'cold'}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"score-{uuid.uuid4()}",
            system_message='You are a lead scoring expert. Return ONLY JSON: {"score": <1-100>, "reasoning": "<brief>", "category": "<hot|warm|cold>"}'
        )
        chat.with_model("openai", "gpt-5.2")
        prompt = f"Score lead: {lead['name']} (@{lead['handle']}) on {lead['platform']}, {lead.get('followers',0)} followers, {lead.get('engagement_rate',0)}% engagement, bio: {lead.get('bio','N/A')}"
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = str(response)
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        result = json.loads(response_text[start:end]) if start != -1 else json.loads(response_text)
        score = min(100, max(1, int(result.get('score', 50))))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return result
    except Exception as e:
        logger.error(f"AI scoring error: {e}")
        score = min(100, int(lead.get('engagement_rate', 0) * 20 + min(lead.get('followers', 0) / 1000, 50)))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return {'score': score, 'reasoning': 'Scored based on engagement and followers', 'category': 'warm' if score > 50 else 'cold'}

# ==================== Analytics ====================
@api_router.get("/analytics/overview")
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

@api_router.get("/analytics/pipeline")
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

# ==================== Templates ====================
@api_router.get("/templates")
async def get_templates(user=Depends(get_current_user), category: Optional[str] = None, search: Optional[str] = None):
    query = {'user_id': user['id']}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [{'name': {'$regex': search, '$options': 'i'}}, {'content': {'$regex': search, '$options': 'i'}}]
    templates = await db.templates.find(query, {'_id': 0}).sort('usage_count', -1).to_list(100)
    return {'templates': templates}

@api_router.post("/templates")
async def create_template(data: TemplateCreate, user=Depends(get_current_user)):
    t_id = str(uuid.uuid4())
    doc = {'id': t_id, 'user_id': user['id'], 'name': data.name, 'content': data.content,
           'category': data.category, 'tags': data.tags, 'usage_count': 0,
           'created_at': datetime.now(timezone.utc).isoformat()}
    await db.templates.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.put("/templates/{template_id}")
async def update_template(template_id: str, data: TemplateUpdate, user=Depends(get_current_user)):
    ud = {k: v for k, v in data.model_dump().items() if v is not None}
    if not ud:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.templates.update_one({'id': template_id, 'user_id': user['id']}, {'$set': ud})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    t = await db.templates.find_one({'id': template_id}, {'_id': 0})
    return t

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user=Depends(get_current_user)):
    r = await db.templates.delete_one({'id': template_id, 'user_id': user['id']})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {'message': 'Template deleted'}

# ==================== Settings ====================
@api_router.get("/settings")
async def get_settings(user=Depends(get_current_user)):
    s = await db.settings.find_one({'user_id': user['id']}, {'_id': 0})
    if not s:
        s = {'user_id': user['id'], 'notifications_enabled': True, 'auto_score': True,
             'daily_outreach_limit': 50, 'connected_accounts': []}
        await db.settings.insert_one(s)
        s.pop('_id', None)
    return s

@api_router.put("/settings")
async def update_settings(data: dict, user=Depends(get_current_user)):
    data.pop('_id', None)
    data.pop('user_id', None)
    await db.settings.update_one({'user_id': user['id']}, {'$set': data}, upsert=True)
    s = await db.settings.find_one({'user_id': user['id']}, {'_id': 0})
    return s

# ==================== Seed Data ====================
@api_router.post("/seed-data")
async def seed_data(user=Depends(get_current_user)):
    uid = user['id']
    existing = await db.leads.count_documents({'user_id': uid})
    if existing > 0:
        return {'message': 'Data already seeded', 'leads': existing}

    lead_data = [
        {"name": "Sarah Mitchell", "handle": "sarah.creates", "platform": "instagram", "bio": "Digital marketing consultant | Helping brands grow", "followers": 45200, "engagement_rate": 4.8, "status": "qualified", "score": 85, "tags": ["interested", "high-value"]},
        {"name": "Marcus Chen", "handle": "marcusdesigns", "platform": "instagram", "bio": "UI/UX Designer | Open to collaborations", "followers": 12800, "engagement_rate": 6.2, "status": "contacted", "score": 72, "tags": ["interested"]},
        {"name": "Emily Rodriguez", "handle": "emily.r.coaching", "platform": "facebook", "bio": "Life coach | Transformation specialist", "followers": 8900, "engagement_rate": 3.5, "status": "new", "score": 55, "tags": ["nurture"]},
        {"name": "James Wilson", "handle": "jwilson_biz", "platform": "linkedin", "bio": "CEO at TechStart | Serial entrepreneur", "followers": 32100, "engagement_rate": 2.1, "status": "negotiation", "score": 92, "tags": ["high-value", "decision-maker"]},
        {"name": "Aisha Patel", "handle": "aisha.content", "platform": "instagram", "bio": "Content strategist | 500+ brands served", "followers": 67500, "engagement_rate": 5.3, "status": "qualified", "score": 88, "tags": ["interested", "influencer"]},
        {"name": "Tom Baker", "handle": "tombaker_fitness", "platform": "instagram", "bio": "Fitness coach | Online programs", "followers": 23400, "engagement_rate": 7.1, "status": "contacted", "score": 68, "tags": ["interested"]},
        {"name": "Lisa Chang", "handle": "lisachang.writes", "platform": "twitter", "bio": "Copywriter | Brand voice specialist", "followers": 5600, "engagement_rate": 4.2, "status": "new", "score": 45, "tags": []},
        {"name": "David Kim", "handle": "dkim_ventures", "platform": "linkedin", "bio": "Angel investor | Looking for SaaS tools", "followers": 18900, "engagement_rate": 1.8, "status": "closed", "score": 95, "tags": ["closed-won", "high-value"]},
        {"name": "Rachel Torres", "handle": "rachel.social", "platform": "instagram", "bio": "Social media manager | DM for collabs", "followers": 34200, "engagement_rate": 5.9, "status": "qualified", "score": 78, "tags": ["interested"]},
        {"name": "Alex Nguyen", "handle": "alexn.photo", "platform": "instagram", "bio": "Photographer | Booking 2025", "followers": 51000, "engagement_rate": 8.3, "status": "new", "score": 62, "tags": ["nurture"]},
        {"name": "Sophie White", "handle": "sophiewhite_co", "platform": "facebook", "bio": "E-commerce consultant | Shopify expert", "followers": 15700, "engagement_rate": 3.8, "status": "contacted", "score": 58, "tags": []},
        {"name": "Brian Foster", "handle": "brianfoster.dev", "platform": "twitter", "bio": "Full-stack developer | Building in public", "followers": 9200, "engagement_rate": 2.5, "status": "new", "score": 35, "tags": ["cold"]},
        {"name": "Olivia Hayes", "handle": "olivia.brand", "platform": "instagram", "bio": "Brand designer | Luxury aesthetic", "followers": 28300, "engagement_rate": 6.7, "status": "negotiation", "score": 82, "tags": ["interested", "high-value"]},
        {"name": "Chris Murphy", "handle": "chrismurphy.biz", "platform": "linkedin", "bio": "B2B Sales | Partnership inquiries welcome", "followers": 42000, "engagement_rate": 3.1, "status": "qualified", "score": 76, "tags": ["decision-maker"]},
        {"name": "Nina Kowalski", "handle": "ninak.style", "platform": "instagram", "bio": "Fashion influencer | Open to deals", "followers": 89000, "engagement_rate": 9.2, "status": "contacted", "score": 90, "tags": ["influencer", "high-value"]},
        {"name": "Ryan Brooks", "handle": "ryanb.tech", "platform": "twitter", "bio": "Tech reviewer | 100K YouTube", "followers": 14500, "engagement_rate": 4.0, "status": "new", "score": 52, "tags": ["nurture"]},
        {"name": "Maya Singh", "handle": "maya.wellness", "platform": "instagram", "bio": "Wellness coach | Retreats & workshops", "followers": 37800, "engagement_rate": 5.5, "status": "lost", "score": 40, "tags": ["not-qualified"]},
        {"name": "Jordan Lee", "handle": "jordanlee.art", "platform": "instagram", "bio": "Digital artist | NFT creator", "followers": 21600, "engagement_rate": 7.8, "status": "new", "score": 48, "tags": []},
        {"name": "Kate Anderson", "handle": "kate.consulting", "platform": "linkedin", "bio": "Management consultant | Fortune 500 exp", "followers": 25900, "engagement_rate": 2.9, "status": "qualified", "score": 80, "tags": ["high-value", "decision-maker"]},
        {"name": "Derek Morris", "handle": "derek_ecom", "platform": "facebook", "bio": "E-commerce entrepreneur | 7-figure seller", "followers": 48700, "engagement_rate": 4.6, "status": "negotiation", "score": 87, "tags": ["interested", "high-value"]},
    ]

    leads = []
    for ld in lead_data:
        lead_id = str(uuid.uuid4())
        lead_doc = {
            'id': lead_id, 'user_id': uid,
            'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={ld['handle']}",
            'last_contacted': (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat() if ld['status'] != 'new' else None,
            'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))).isoformat(),
            'notes': '', **ld
        }
        leads.append(lead_doc)
    await db.leads.insert_many(leads)

    sample_convos = [
        {"lead_idx": 0, "msgs": [
            {"sender": "lead", "content": "Hey! I saw your post about social media growth strategies. Really interested!"},
            {"sender": "user", "content": "Hi Sarah! Thanks for reaching out. I'd love to share how we can help."},
            {"sender": "lead", "content": "That sounds great! What packages do you offer?"},
            {"sender": "user", "content": "We have three tiers - Starter, Growth, and Enterprise. I'd recommend Growth for you."},
            {"sender": "lead", "content": "What's included in Growth? And pricing?"}
        ], "status": "active"},
        {"lead_idx": 3, "msgs": [
            {"sender": "user", "content": "Hi James, noticed you're building at TechStart. Would love to discuss potential synergies."},
            {"sender": "lead", "content": "Interesting - we're looking for a social CRM. Tell me more."},
            {"sender": "user", "content": "Our platform converts social followers into customers with AI. Want a demo?"},
            {"sender": "lead", "content": "Yes, how about next Tuesday?"},
            {"sender": "user", "content": "Tuesday works! I'll send a calendar invite."},
            {"sender": "lead", "content": "Can you send case studies beforehand?"}
        ], "status": "active"},
        {"lead_idx": 4, "msgs": [
            {"sender": "lead", "content": "I've been following your content. You mentioned AI-powered outreach?"},
            {"sender": "user", "content": "Hi Aisha! Yes, we use AI to personalize outreach at scale."},
            {"sender": "lead", "content": "I'm interested. I spend hours on DMs every day."}
        ], "status": "active"},
        {"lead_idx": 8, "msgs": [
            {"sender": "user", "content": "Hi Rachel! Our tool could save you tons of time with DM management."},
            {"sender": "lead", "content": "Hey! I've been looking for something like this. What makes yours different?"},
            {"sender": "user", "content": "We combine AI suggestions with lead scoring to prioritize and respond."},
            {"sender": "lead", "content": "Do you have a free trial?"}
        ], "status": "active"},
        {"lead_idx": 12, "msgs": [
            {"sender": "lead", "content": "Hi! I'm interested in your services."},
            {"sender": "user", "content": "Hey Olivia! Thanks for reaching out. What are you looking for?"},
            {"sender": "lead", "content": "I need help with brand identity."},
            {"sender": "user", "content": "I can help! Let me put together a proposal."}
        ], "status": "active"},
        {"lead_idx": 14, "msgs": [
            {"sender": "user", "content": "Hi Nina! Love your fashion content. We have a collaboration opportunity."},
            {"sender": "lead", "content": "Thanks! What kind of collaboration?"}
        ], "status": "active"},
        {"lead_idx": 7, "msgs": [
            {"sender": "user", "content": "Hi David, saw your post about SaaS tools. We might be a fit."},
            {"sender": "lead", "content": "Tell me about pricing."},
            {"sender": "user", "content": "Enterprise plan: $299/month, unlimited seats."},
            {"sender": "lead", "content": "Let's do it. Send the signup link."},
            {"sender": "user", "content": "Welcome aboard, David!"}
        ], "status": "closed"},
        {"lead_idx": 6, "msgs": [
            {"sender": "user", "content": "Hey Lisa, your copywriting is impressive! We need a brand voice specialist."}
        ], "status": "pending"},
    ]

    conversations = []
    for sc in sample_convos:
        conv_id = str(uuid.uuid4())
        lead = leads[sc["lead_idx"]]
        conv_doc = {
            'id': conv_id, 'user_id': uid, 'lead_id': lead['id'],
            'lead_name': lead['name'], 'lead_handle': lead['handle'],
            'lead_avatar': lead['avatar'], 'platform': lead['platform'],
            'status': sc['status'], 'last_message': sc['msgs'][-1]['content'],
            'last_message_at': (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))).isoformat(),
            'unread_count': random.randint(0, 3) if sc['status'] == 'active' else 0,
            'starred': random.choice([True, False]),
            'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).isoformat()
        }
        conversations.append(conv_doc)
        msg_docs = []
        for i, msg in enumerate(sc['msgs']):
            msg_docs.append({
                'id': str(uuid.uuid4()), 'conversation_id': conv_id,
                'sender': msg['sender'], 'content': msg['content'],
                'timestamp': (datetime.now(timezone.utc) - timedelta(hours=len(sc['msgs'])-i)).isoformat(),
                'ai_generated': False
            })
        if msg_docs:
            await db.messages.insert_many(msg_docs)
    await db.conversations.insert_many(conversations)

    template_data = [
        {"name": "Cold Outreach - Value Prop", "content": "Hey {name}! I've been following your content and love what you're doing with {topic}. I help creators like you turn followers into paying customers. Would you be open to a quick chat?", "category": "cold_outreach", "tags": ["cold", "opening"]},
        {"name": "Follow-Up - No Response", "content": "Hi {name}, just bumping this up! I know you're busy, but I genuinely think we could create something amazing together. Would 15 minutes this week work?", "category": "follow_up", "tags": ["follow-up", "nurture"]},
        {"name": "Objection - Price Concern", "content": "I totally understand the budget concern, {name}. Our clients typically see 3-5x ROI within the first month. Would case studies help?", "category": "objection_handling", "tags": ["objection", "pricing"]},
        {"name": "Closing - Decision Push", "content": "Great chatting with you, {name}! Based on our discussion, the {plan} plan would be perfect. Ready to get started?", "category": "closing", "tags": ["closing", "conversion"]},
        {"name": "Re-engagement", "content": "Hey {name}! It's been a while since we last spoke. I wanted to share some exciting updates. Got a minute?", "category": "follow_up", "tags": ["re-engagement", "nurture"]},
        {"name": "Thank You - Post Sale", "content": "Welcome to the family, {name}! Your account is all set up. Here's your onboarding guide: {link}. Reach out anytime!", "category": "post_sale", "tags": ["onboarding", "retention"]},
        {"name": "Discovery Question", "content": "That's really interesting, {name}. What's your biggest challenge converting followers into customers?", "category": "discovery", "tags": ["discovery", "question"]},
        {"name": "Social Proof Drop", "content": "Just wrapped up with a creator in your niche. They went from 2% to 18% DM conversion in 3 weeks. Happy to share what worked!", "category": "cold_outreach", "tags": ["social-proof", "results"]},
    ]
    templates = []
    for td in template_data:
        templates.append({'id': str(uuid.uuid4()), 'user_id': uid, 'usage_count': random.randint(0, 50),
                          'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))).isoformat(), **td})
    await db.templates.insert_many(templates)

    return {'message': 'Demo data seeded', 'leads': len(leads), 'conversations': len(conversations), 'templates': len(templates)}

# ==================== Billing ====================
@api_router.get("/billing/plans")
async def get_plans():
    plans = []
    for pid, p in SUBSCRIPTION_PLANS.items():
        plans.append({
            "id": pid, "name": p["name"], "price": p["price"],
            "leads_limit": p["leads_limit"], "ai_daily_limit": p["ai_daily_limit"],
            "accounts_limit": p["accounts_limit"], "team_limit": p["team_limit"],
        })
    return {"plans": plans}

@api_router.post("/billing/create-checkout")
async def create_checkout(data: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    if data.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    plan = SUBSCRIPTION_PLANS[data.plan_id]
    origin = data.origin_url.rstrip('/')
    success_url = f"{origin}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"

    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {"user_id": user['id'], "plan_id": data.plan_id, "user_email": user['email']}

    checkout_req = CheckoutSessionRequest(
        amount=plan["price"], currency="usd",
        success_url=success_url, cancel_url=cancel_url, metadata=metadata
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Record transaction
    tx_doc = {
        'id': str(uuid.uuid4()), 'session_id': session.session_id,
        'user_id': user['id'], 'plan_id': data.plan_id,
        'amount': plan["price"], 'currency': 'usd',
        'metadata': metadata, 'payment_status': 'initiated',
        'status': 'pending', 'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(tx_doc)

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/billing/status/{session_id}")
async def get_billing_status(session_id: str, user=Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    host_url = "https://localhost"
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction in DB
    tx = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
    if tx:
        already_processed = tx.get('payment_status') == 'paid'
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': {'status': status.status, 'payment_status': status.payment_status,
                      'amount_total': status.amount_total, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
        # Activate subscription if paid and not already processed
        if status.payment_status == 'paid' and not already_processed:
            plan_id = tx.get('plan_id', 'starter')
            await db.users.update_one(
                {'id': user['id']},
                {'$set': {
                    'subscription': plan_id,
                    'subscription_status': 'active',
                    'subscription_started': datetime.now(timezone.utc).isoformat(),
                    'subscription_session_id': session_id
                }}
            )

    return {
        "status": status.status, "payment_status": status.payment_status,
        "amount_total": status.amount_total, "currency": status.currency,
        "plan_id": tx.get('plan_id') if tx else None
    }

@api_router.get("/billing/subscription")
async def get_subscription(user=Depends(get_current_user)):
    full_user = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password_hash': 0})
    sub = full_user.get('subscription', 'free')
    sub_status = full_user.get('subscription_status', 'inactive')
    trial_end = full_user.get('trial_end')

    # Check if trial expired
    if sub_status == 'trial' and trial_end:
        trial_end_dt = datetime.fromisoformat(trial_end)
        if trial_end_dt.tzinfo is None:
            trial_end_dt = trial_end_dt.replace(tzinfo=timezone.utc)
        if trial_end_dt < datetime.now(timezone.utc):
            await db.users.update_one(
                {'id': user['id']},
                {'$set': {'subscription': 'free', 'subscription_status': 'expired'}}
            )
            sub = 'free'
            sub_status = 'expired'

    plan_details = SUBSCRIPTION_PLANS.get(sub, None)
    txs = await db.payment_transactions.find(
        {'user_id': user['id']}, {'_id': 0}
    ).sort('created_at', -1).limit(5).to_list(5)

    days_remaining = None
    if sub_status == 'trial' and trial_end:
        trial_end_dt = datetime.fromisoformat(trial_end)
        if trial_end_dt.tzinfo is None:
            trial_end_dt = trial_end_dt.replace(tzinfo=timezone.utc)
        days_remaining = max(0, (trial_end_dt - datetime.now(timezone.utc)).days)

    return {
        'plan': sub, 'status': sub_status,
        'plan_details': plan_details,
        'started': full_user.get('subscription_started'),
        'trial_end': trial_end,
        'days_remaining': days_remaining,
        'transactions': txs
    }

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        if STRIPE_API_KEY:
            host_url = str(request.base_url).rstrip('/')
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            webhook_response = await stripe_checkout.handle_webhook(body, sig)
            if webhook_response and webhook_response.payment_status == 'paid':
                session_id = webhook_response.session_id
                tx = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
                if tx and tx.get('payment_status') != 'paid':
                    await db.payment_transactions.update_one(
                        {'session_id': session_id},
                        {'$set': {'payment_status': 'paid', 'status': 'complete',
                                  'updated_at': datetime.now(timezone.utc).isoformat()}}
                    )
                    await db.users.update_one(
                        {'id': tx['user_id']},
                        {'$set': {'subscription': tx['plan_id'], 'subscription_status': 'active',
                                  'subscription_started': datetime.now(timezone.utc).isoformat()}}
                    )
            return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"status": "ok"}

# ==================== Root ====================
@api_router.get("/")
async def root():
    return {"message": "GoSocial API"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index('email', unique=True)
    await db.users.create_index('id', unique=True)
    await db.leads.create_index([('user_id', 1), ('status', 1)])
    await db.leads.create_index([('user_id', 1), ('score', -1)])
    await db.conversations.create_index([('user_id', 1), ('last_message_at', -1)])
    await db.messages.create_index('conversation_id')
    logger.info("GoSocial API started, indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
