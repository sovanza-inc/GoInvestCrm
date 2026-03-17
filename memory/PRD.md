# GoSocial - Product Requirements Document

## Problem Statement
Build a web-based SaaS platform called "GoSocial" to help entrepreneurs and content creators convert their social media followers into paying customers.

## Tech Stack
- **Frontend:** React, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** FastAPI (Python), modular route architecture
- **Database:** MongoDB
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **Auth:** JWT + Google OAuth (Emergent-managed)
- **Payments:** Stripe

## Architecture (Post-Refactor)
```
/app/backend/
├── server.py              # App entry, middleware, startup (~70 lines)
├── config.py              # Env vars, constants
├── database.py            # MongoDB connection
├── models.py              # Pydantic models
├── auth.py                # Auth helpers
├── routes/
│   ├── auth_routes.py     # /api/auth/*
│   ├── leads.py           # /api/leads/*
│   ├── conversations.py   # /api/conversations/*
│   ├── ai.py              # /api/ai/*
│   ├── analytics.py       # /api/analytics/*
│   ├── templates.py       # /api/templates/*
│   ├── settings.py        # /api/settings/*
│   ├── billing.py         # /api/billing/*
│   └── seed.py            # /api/seed-data
```

## Completed Features (MVP Phase 1)
- [x] JWT auth (register/login) with 7-day Growth trial
- [x] Google OAuth social login
- [x] Lead management (CRUD, scoring, filtering, tagging)
- [x] CRM inbox (conversations, messages, star)
- [x] AI Sales Copilot (reply suggestions - GPT-5.2)
- [x] AI Lead Scoring
- [x] Analytics dashboard (overview, pipeline)
- [x] Message templates (CRUD)
- [x] Stripe subscription billing (3 tiers)
- [x] Landing page (REVE Chat style design)
- [x] Backend refactored to modular architecture

## Upcoming Tasks (Phase 2 - P0)
- [ ] Team Collaboration - multi-user roles/permissions
- [ ] Advanced AI Coaching - real AI conversation scoring
- [ ] Automated Outreach (Autopilot) - target criteria + auto DMs
- [ ] Voice/Video Messaging in CRM
- [ ] LinkedIn Integration

## Future Tasks (Phase 3 - P1)
- [ ] Custom AI fine-tuning per user
- [ ] Advanced lead segmentation
- [ ] Predictive analytics
- [ ] Mobile application

## Mocked Features
- AI features fall back to mocked responses when LLM key budget is low
- Social media API integrations are simulated
