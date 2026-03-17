# GoSocial - Social Media Sales Automation Platform

## Problem Statement
SaaS platform helping content creators convert social media followers into paying customers through AI-powered sales assistance and lead management.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI + MongoDB + emergentintegrations (port 8001)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key for reply suggestions and lead scoring
- **Auth**: JWT-based (bcrypt + PyJWT)

## User Personas
1. Content creators with large social media audiences
2. Entrepreneurs selling products/services via DMs
3. Social media managers handling multiple accounts
4. Small business owners doing social selling

## Core Requirements
- [x] JWT Authentication (register/login)
- [x] Lead Management with AI scoring (1-100, hot/warm/cold)
- [x] CRM Inbox with conversation threads
- [x] AI Sales Copilot (3 reply suggestions per conversation)
- [x] Analytics Dashboard (pipeline funnel, lead quality, platform distribution)
- [x] Message Templates Library (CRUD with categories)
- [x] Settings & Preferences
- [x] Demo data seeding (20 leads, 8 conversations, 8 templates)

## What's Been Implemented (MVP Phase 1 - March 2026)
- Full JWT auth system with register/login/me
- 20 seeded leads across Instagram, Facebook, LinkedIn, Twitter
- Lead CRUD with filtering by status/platform/score/search
- 8 seeded conversations with realistic message threads
- AI reply suggestions using GPT-5.2 (casual/professional/direct tones)
- AI lead scoring with reasoning
- Analytics overview (KPIs) and pipeline data
- Template CRUD with categories and tags
- Settings with notification preferences
- Dark theme SaaS UI with Outfit + Plus Jakarta Sans fonts
- Sidebar navigation, responsive design
- **Stripe Subscription System** (March 2026):
  - 3 tiers: Starter ($29/mo), Growth ($79/mo), Enterprise ($199/mo)
  - Stripe Checkout integration with session management
  - Payment status polling on frontend
  - Webhook handling for payment confirmation
  - Subscription status in user profile and Settings page
  - payment_transactions collection for audit trail
- **Landing Page** (March 2026):
  - Public marketing page with hero, features grid, how it works, pricing preview
  - "7-day free trial on Growth plan" badge
  - Dual CTAs: Start Free Trial + Sign in with Google
  - Stats section, footer
- **Google Social Login** (March 2026):
  - Emergent-managed Google OAuth integration
  - "Continue with Google" on both Sign In and Sign Up tabs
  - Backend session exchange via /api/auth/google
  - Automatic user creation for new Google users
- **7-Day Free Trial** (March 2026):
  - New users (email or Google) get Growth plan trial
  - Trial status tracked with trial_end date
  - Auto-downgrade to Free when trial expires
  - "Trial - X days left" badge in Settings
  - days_remaining in billing/subscription API

## Prioritized Backlog

### P0 (Next Sprint)
- Real Instagram/Facebook OAuth integration
- Webhook for real-time message sync
- Team collaboration (multi-user, roles)

### P1
- Advanced AI coaching (conversation scoring)
- Automated outreach/autopilot with batch sending
- Voice/video messaging
- CSV lead import/export

### P2
- LinkedIn integration
- Custom AI fine-tuning per user
- Predictive analytics (close probability)
- Mobile app
- Stripe/payment integration
- API for third-party integrations

## Next Tasks
1. Implement real social platform OAuth (Instagram Graph API, Facebook Graph API)
2. Add team collaboration features (invite, roles, permissions)
3. Build automated outreach system with safety limits
4. Add conversation scoring and coaching feedback
5. Implement CSV import for leads
