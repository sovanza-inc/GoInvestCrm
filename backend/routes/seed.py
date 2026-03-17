from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import uuid
import random

from database import db
from auth import get_current_user

router = APIRouter()


@router.post("/seed-data")
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
