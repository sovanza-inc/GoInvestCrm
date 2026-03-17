from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid
import logging

from database import db
from auth import get_current_user
from config import SUBSCRIPTION_PLANS, STRIPE_API_KEY
from models import CheckoutRequest
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing")


@router.get("/plans")
async def get_plans():
    plans = []
    for pid, p in SUBSCRIPTION_PLANS.items():
        plans.append({
            "id": pid, "name": p["name"], "price": p["price"],
            "leads_limit": p["leads_limit"], "ai_daily_limit": p["ai_daily_limit"],
            "accounts_limit": p["accounts_limit"], "team_limit": p["team_limit"],
        })
    return {"plans": plans}


@router.post("/create-checkout")
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

    tx_doc = {
        'id': str(uuid.uuid4()), 'session_id': session.session_id,
        'user_id': user['id'], 'plan_id': data.plan_id,
        'amount': plan["price"], 'currency': 'usd',
        'metadata': metadata, 'payment_status': 'initiated',
        'status': 'pending', 'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(tx_doc)

    return {"url": session.url, "session_id": session.session_id}


@router.get("/status/{session_id}")
async def get_billing_status(session_id: str, user=Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    host_url = "https://localhost"
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    tx = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
    if tx:
        already_processed = tx.get('payment_status') == 'paid'
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': {'status': status.status, 'payment_status': status.payment_status,
                      'amount_total': status.amount_total, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
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


@router.get("/subscription")
async def get_subscription(user=Depends(get_current_user)):
    full_user = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password_hash': 0})
    sub = full_user.get('subscription', 'free')
    sub_status = full_user.get('subscription_status', 'inactive')
    trial_end = full_user.get('trial_end')

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


async def handle_stripe_webhook(request: Request):
    """Called from main app for the webhook endpoint."""
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
