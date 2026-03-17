from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import uuid
import requests as http_requests
import logging

from database import db
from auth import hash_password, verify_password, create_token, get_current_user
from models import UserCreate, UserLogin, GoogleAuthRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")


@router.post("/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({'email': data.email})
    if existing:
        from fastapi import HTTPException
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
    await db.users.update_one({'id': user_id}, {'$set': {
        'subscription': 'growth', 'subscription_status': 'trial',
        'trial_end': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }})
    return {'token': token, 'user': {'id': user_id, 'email': data.email, 'name': data.name, 'company': data.company or '', 'created_at': user_doc['created_at']}}


@router.post("/login")
async def login(data: UserLogin):
    from fastapi import HTTPException
    user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user['id'])
    return {'token': token, 'user': {'id': user['id'], 'email': user['email'], 'name': user['name'], 'company': user.get('company', ''), 'created_at': user['created_at']}}


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return {'user': user}


@router.post("/google")
async def google_auth(data: GoogleAuthRequest):
    from fastapi import HTTPException
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
