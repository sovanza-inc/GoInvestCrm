# GoSocial - Product Requirements Document

## Problem Statement
Build a web-based SaaS platform called "GoSocial" to help entrepreneurs and content creators convert their social media followers into paying customers.

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** FastAPI (Python), modular route architecture
- **Database:** MongoDB (Motor async driver)
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **Auth:** JWT + Google OAuth (Emergent-managed)
- **Payments:** Stripe

## Architecture
```
/app/backend/
├── server.py              # App entry, middleware, startup
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
│   ├── seed.py            # /api/seed-data
│   ├── profile.py         # /api/profile/*
│   ├── team.py            # /api/team/*
│   ├── autopilot.py       # /api/autopilot/*
│   └── integrations.py    # /api/integrations/*

/app/frontend/src/
├── pages/
│   ├── AutopilotPage.js
│   ├── IntegrationsPage.js
│   ├── DashboardPage.js
│   ├── LeadsPage.js
│   ├── CRMPage.js
│   ├── AnalyticsPage.js
│   ├── TemplatesPage.js
│   ├── ProfilePage.js
│   ├── TeamPage.js
│   ├── SettingsPage.js
│   ├── PricingPage.js
│   ├── LoginPage.js
│   └── LandingPage.js
├── contexts/
│   ├── AuthContext.js
│   └── ThemeContext.js
├── lib/
│   ├── api.js
│   ├── colors.js
│   └── utils.js
├── components/
│   ├── Layout.js
│   └── ui/ (shadcn components)
```

## Completed Features

### MVP Phase 1
- [x] JWT auth (register/login) with 7-day Growth trial
- [x] Google OAuth social login
- [x] Lead management (CRUD, scoring, filtering, tagging)
- [x] CRM inbox (conversations, messages, star)
- [x] AI Sales Copilot (reply suggestions - GPT-5.2)
- [x] AI Lead Scoring
- [x] Analytics dashboard (overview, pipeline)
- [x] Message templates (CRUD)
- [x] Stripe subscription billing (3 tiers)
- [x] Landing page
- [x] Backend modular architecture

### Phase 2
- [x] Bulk Lead Actions (CSV import/export, bulk update/delete)
- [x] Profile page (personal/company info, password change)
- [x] Team Management (invite, roles: Admin/Manager/Agent, lead assignment)
- [x] Enhanced CRM Filters (platform, status, assignment, date, sort)
- [x] Global Dark/Light Theme (ChatGPT-inspired, persistent, fully theme-aware)

### Phase 3 (Current Session - March 18, 2026)
- [x] Automated Outreach (Autopilot) - campaign CRUD, targeting criteria, multi-step sequences with A/B variants, simulate/preview, per-step analytics
- [x] WhatsApp Integration (SIMULATED) - connect/disconnect, conversation inbox, messaging with auto-replies, demo data seeding
- [x] Instagram DM Integration (SIMULATED) - connect/disconnect, conversation inbox, messaging with auto-replies, demo data seeding
- [x] Theme Fix - Comprehensive color correction across ALL 12 pages, replacing hardcoded slate/white colors with CSS variables

## Upcoming Tasks (P1)
- [ ] Team Collaboration Enhancements - activity log, team performance dashboard
- [ ] Voice/Video Messaging in CRM
- [ ] LinkedIn Integration

## Future Tasks (P2)
- [ ] Custom AI fine-tuning per user
- [ ] Advanced lead segmentation
- [ ] Predictive analytics
- [ ] Mobile application
- [ ] Real WhatsApp Business API integration (requires Meta API keys)
- [ ] Real Instagram DM API integration (requires Meta API keys)

## Key API Endpoints
- **Autopilot**: `GET/POST /api/autopilot/campaigns`, `PUT/DELETE /api/autopilot/campaigns/{id}`, `PUT /api/autopilot/campaigns/{id}/toggle`, `POST /api/autopilot/campaigns/{id}/simulate`, `GET /api/autopilot/campaigns/{id}/analytics`
- **Integrations**: `GET /api/integrations`, `POST /api/integrations/connect`, `DELETE /api/integrations/{id}`, `GET/POST /api/integrations/{platform}/conversations/*`, `POST /api/integrations/{platform}/seed-demo`

## Mocked/Simulated Features
- WhatsApp integration: SIMULATED (auto-generates replies)
- Instagram DM integration: SIMULATED (auto-generates replies)

## Design System
- Theme: CSS variables in `/frontend/src/index.css` (light/dark)
- Colors: `/frontend/src/lib/colors.js`
- ThemeContext: `/frontend/src/contexts/ThemeContext.js`
- All UI uses semantic CSS variables: bg-card, text-foreground, text-muted-foreground, border-border, bg-muted, bg-background, bg-accent
- Dark mode: ChatGPT-inspired
- NO hardcoded slate/white colors in any page
