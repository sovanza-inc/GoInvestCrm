from fastapi import FastAPI, APIRouter, Request
from starlette.middleware.cors import CORSMiddleware
import logging

from config import CORS_ORIGINS
from database import db, client

# Route imports
from routes.auth_routes import router as auth_router
from routes.leads import router as leads_router
from routes.conversations import router as conversations_router
from routes.ai import router as ai_router
from routes.analytics import router as analytics_router
from routes.templates import router as templates_router
from routes.settings import router as settings_router
from routes.billing import router as billing_router, handle_stripe_webhook
from routes.seed import router as seed_router
from routes.profile import router as profile_router
from routes.team import router as team_router
from routes.autopilot import router as autopilot_router
from routes.integrations import router as integrations_router
from routes.activity import router as activity_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Include all sub-routers into the api_router
api_router.include_router(auth_router)
api_router.include_router(leads_router)
api_router.include_router(conversations_router)
api_router.include_router(ai_router)
api_router.include_router(analytics_router)
api_router.include_router(templates_router)
api_router.include_router(settings_router)
api_router.include_router(billing_router)
api_router.include_router(seed_router)
api_router.include_router(profile_router)
api_router.include_router(team_router)
api_router.include_router(autopilot_router)
api_router.include_router(integrations_router)
api_router.include_router(activity_router)


@api_router.get("/")
async def root():
    return {"message": "GoSocial API"}


app.include_router(api_router)

# Stripe webhook must be registered on the app directly (not through prefix router)
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    return await handle_stripe_webhook(request)

app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index('email', unique=True)
    await db.users.create_index('id', unique=True)
    await db.users.create_index('team_id')
    await db.leads.create_index([('user_id', 1), ('status', 1)])
    await db.leads.create_index([('user_id', 1), ('score', -1)])
    await db.leads.create_index([('user_id', 1), ('assigned_to', 1)])
    await db.conversations.create_index([('user_id', 1), ('last_message_at', -1)])
    await db.conversations.create_index([('user_id', 1), ('assigned_to', 1)])
    await db.messages.create_index('conversation_id')
    await db.campaigns.create_index([('user_id', 1), ('status', 1)])
    await db.campaign_executions.create_index([('campaign_id', 1), ('executed_at', -1)])
    await db.integrations.create_index([('user_id', 1), ('platform', 1)], unique=True)
    await db.platform_conversations.create_index([('user_id', 1), ('platform', 1)])
    await db.platform_messages.create_index('conversation_id')
    await db.activity_log.create_index([('user_id', 1), ('timestamp', -1)])
    await db.activity_log.create_index('entity_type')
    logger.info("GoSocial API started, indexes created")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
