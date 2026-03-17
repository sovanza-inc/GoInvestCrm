import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'gosocial-jwt-secret-2024')
JWT_ALGORITHM = 'HS256'
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

SUBSCRIPTION_PLANS = {
    "starter": {"name": "Starter", "price": 29.00, "leads_limit": 500, "ai_daily_limit": 10, "accounts_limit": 1, "team_limit": 1},
    "growth": {"name": "Growth", "price": 79.00, "leads_limit": 5000, "ai_daily_limit": -1, "accounts_limit": 5, "team_limit": 3},
    "enterprise": {"name": "Enterprise", "price": 199.00, "leads_limit": -1, "ai_daily_limit": -1, "accounts_limit": -1, "team_limit": -1},
}
