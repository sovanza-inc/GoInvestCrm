import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, ArrowRight, Check, Star, Users, Sparkles, MessageSquare,
  BarChart3, FileText, Target, Crown, Rocket, Globe, Brain,
  Send, Filter, TrendingUp, Clock, Shield, Inbox, ChevronRight,
  LayoutDashboard, UserCheck, Bot, Mail, Workflow, PieChart, Sun, Moon
} from "lucide-react";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/3007fe4f-ebc2-4c42-97e8-25bcb565ef33/images/819e9d66cc0feb90faa6536c8e01e5548a059e6bb8636f1a14667e09c252ffa8.png";

/* ─── Solution Tabs ─── */
const solutionTabs = [
  { key: "scoring", label: "Lead Scoring" },
  { key: "copilot", label: "AI Copilot" },
  { key: "campaign", label: "Campaign" },
];

const solutionStats = {
  scoring: [
    { value: "80%", label: "Increase in engagement", color: "from-emerald-500 to-teal-600" },
    { value: "35%", label: "Higher Conversion Rates", color: "from-blue-500 to-blue-700" },
    { value: "2X", label: "More leads qualified", color: "from-violet-500 to-purple-700" },
  ],
  copilot: [
    { value: "3X", label: "Faster reply time", color: "from-emerald-500 to-teal-600" },
    { value: "60%", label: "Less manual effort", color: "from-blue-500 to-blue-700" },
    { value: "92%", label: "Customer satisfaction", color: "from-violet-500 to-purple-700" },
  ],
  campaign: [
    { value: "5X", label: "More outreach volume", color: "from-emerald-500 to-teal-600" },
    { value: "48%", label: "Open rate average", color: "from-blue-500 to-blue-700" },
    { value: "23%", label: "Reply rate achieved", color: "from-violet-500 to-purple-700" },
  ],
};

const solutionBanners = {
  scoring: "AI analyzes engagement, followers, bio keywords, and activity to score every lead 1-100 — so you focus energy on prospects that convert.",
  copilot: "Get AI-generated reply suggestions for every conversation — casual, professional, or direct. Never struggle with what to say again.",
  campaign: "Using campaigns, businesses can easily reach out to prospects through any social platform with personalized messages at scale.",
};

/* ─── Feature Tabs (Everything Section) ─── */
const featureTabs = [
  { key: "scoring", icon: Target, label: "Lead Scoring" },
  { key: "copilot", icon: Sparkles, label: "AI Copilot" },
  { key: "crm", icon: MessageSquare, label: "CRM Inbox" },
  { key: "analytics", icon: BarChart3, label: "Analytics" },
  { key: "templates", icon: FileText, label: "Templates" },
  { key: "outreach", icon: Rocket, label: "Outreach" },
];

/* ─── Mini Mockups ─── */
function LeadScoringMockup() {
  const rows = [
    { name: "Sarah Mitchell", handle: "@sarah.creates", score: 85, status: "Qualified", platform: "IG" },
    { name: "James Wilson", handle: "@jwilson_biz", score: 92, status: "Negotiation", platform: "LI" },
    { name: "Aisha Patel", handle: "@aisha.content", score: 88, status: "Qualified", platform: "IG" },
    { name: "Nina Kowalski", handle: "@ninak.style", score: 90, status: "Contacted", platform: "IG" },
    { name: "David Kim", handle: "@dkim_ventures", score: 95, status: "Closed", platform: "LI" },
  ];
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>Lead</span><span>Platform</span><span>Score</span><span>Status</span><span>Actions</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-5 items-center px-4 py-2.5 rounded-lg bg-slate-800/40 border border-slate-800/60">
          <div><p className="text-xs font-medium text-slate-200">{r.name}</p><p className="text-[10px] text-slate-500">{r.handle}</p></div>
          <span className="text-[10px] text-slate-400">{r.platform}</span>
          <span className={`text-xs font-bold ${r.score >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{r.score}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 w-fit">{r.status}</span>
          <span className="text-[10px] text-violet-400 cursor-pointer">Score AI</span>
        </div>
      ))}
    </div>
  );
}

function AICopilotMockup() {
  return (
    <div className="flex gap-3 h-full">
      <div className="flex-1 space-y-3 p-2">
        <div className="flex justify-start"><div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]"><p className="text-xs text-slate-200">Hey! I saw your post about growth strategies. Super interested!</p></div></div>
        <div className="flex justify-end"><div className="bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]"><p className="text-xs text-slate-200">Thanks Sarah! I'd love to share how we can help scale your efforts.</p></div></div>
        <div className="flex justify-start"><div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]"><p className="text-xs text-slate-200">What packages do you offer?</p></div></div>
      </div>
      <div className="w-52 shrink-0 space-y-2 p-2 bg-violet-500/5 rounded-lg border border-violet-500/10">
        <div className="flex items-center gap-1.5 mb-1"><Sparkles className="w-3 h-3 text-violet-400" /><span className="text-[10px] font-bold text-violet-300 uppercase">AI Suggestions</span></div>
        {["Casual: Hey! Let me walk you through our options...", "Professional: We offer three tiers tailored to...", "Direct: Great question! Here's our Growth plan..."].map((s, i) => (
          <div key={i} className="p-2 rounded bg-violet-500/10 border border-violet-500/15 text-[10px] text-slate-300 leading-relaxed cursor-pointer hover:bg-violet-500/20 transition-colors">{s}</div>
        ))}
      </div>
    </div>
  );
}

function CRMInboxMockup() {
  const convos = [
    { name: "Sarah Mitchell", msg: "What packages do you offer?", platform: "IG", unread: 2, time: "2m" },
    { name: "James Wilson", msg: "Can you send case studies?", platform: "LI", unread: 1, time: "15m" },
    { name: "Aisha Patel", msg: "I spend hours on DMs every day.", platform: "IG", unread: 0, time: "1h" },
    { name: "Rachel Torres", msg: "Do you have a free trial?", platform: "IG", unread: 1, time: "3h" },
    { name: "Olivia Hayes", msg: "Let me put together a proposal.", platform: "IG", unread: 0, time: "5h" },
  ];
  return (
    <div className="space-y-1.5">
      {convos.map((c, i) => (
        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${i === 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-slate-800/40 border-slate-800/60 hover:border-slate-700"}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{c.name.split(" ").map(n => n[0]).join("")}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-200 truncate">{c.name}</p><p className="text-[10px] text-slate-500 truncate">{c.msg}</p></div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px] text-slate-500">{c.time}</span>
            {c.unread > 0 && <span className="w-4 h-4 rounded-full bg-blue-600 text-[9px] text-white flex items-center justify-center">{c.unread}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [42, 65, 38, 78, 55, 90, 72, 85, 60, 45, 80, 68];
  return (
    <div className="space-y-4 p-2">
      <div className="grid grid-cols-4 gap-2">
        {[{ l: "Total Leads", v: "1,240" }, { l: "Qualified", v: "486" }, { l: "Active Chats", v: "38" }, { l: "Conversion", v: "12.5%" }].map((s, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-800/60 text-center">
            <p className="text-[10px] text-slate-500 mb-0.5">{s.l}</p><p className="text-sm font-bold text-white">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 h-24 px-2">
        {bars.map((h, i) => (<div key={i} style={{ height: `${h}%` }} className="flex-1 bg-blue-500/60 rounded-sm hover:bg-blue-400/70 transition-colors" />))}
      </div>
      <div className="flex justify-between px-2 text-[9px] text-slate-600">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <span key={m}>{m}</span>)}</div>
    </div>
  );
}

function TemplatesMockup() {
  const templates = [
    { name: "Cold Outreach", cat: "Opening", uses: 48 },
    { name: "Follow-Up", cat: "Nurture", uses: 32 },
    { name: "Objection - Price", cat: "Closing", uses: 28 },
    { name: "Social Proof Drop", cat: "Opening", uses: 45 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {templates.map((t, i) => (
        <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/60">
          <p className="text-xs font-medium text-white mb-1">{t.name}</p>
          <div className="flex items-center justify-between"><span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{t.cat}</span><span className="text-[10px] text-slate-500">Used {t.uses}x</span></div>
          <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">Hey {"{name}"}! I've been following your content and love what you're doing...</p>
        </div>
      ))}
    </div>
  );
}

function OutreachMockup() {
  return (
    <div className="space-y-3 p-2">
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/60">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-white">Campaign: Growth Outreach</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Active</span></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-sm font-bold text-white">248</p><p className="text-[10px] text-slate-500">Sent</p></div>
          <div><p className="text-sm font-bold text-emerald-400">67%</p><p className="text-[10px] text-slate-500">Open Rate</p></div>
          <div><p className="text-sm font-bold text-blue-400">23%</p><p className="text-[10px] text-slate-500">Reply Rate</p></div>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/60">
        <p className="text-[10px] text-slate-500 mb-1">Target: Instagram creators, 10K+ followers, 3%+ engagement</p>
        <div className="flex gap-2 items-center"><div className="w-3 h-3 rounded-full bg-emerald-500" /><div className="flex-1 h-3 bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full w-[67%] bg-emerald-500 rounded-full" /></div><span className="text-[10px] text-slate-400">67%</span></div>
      </div>
      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
        <div className="flex items-center gap-1.5 mb-1"><Sparkles className="w-3 h-3 text-violet-400" /><span className="text-[10px] font-bold text-violet-300">AI personalized each message</span></div>
        <p className="text-[10px] text-slate-400">Messages are customized based on bio, interests, and past engagement patterns.</p>
      </div>
    </div>
  );
}

const FEATURE_MOCKUPS = { scoring: LeadScoringMockup, copilot: AICopilotMockup, crm: CRMInboxMockup, analytics: AnalyticsMockup, templates: TemplatesMockup, outreach: OutreachMockup };
const FEATURE_DESC = {
  scoring: "AI analyzes engagement, followers, bio keywords, and activity to score every lead 1-100. Focus your energy on prospects most likely to convert.",
  copilot: "Get 3 AI-generated reply suggestions for every conversation - casual, professional, or direct. Never struggle with what to say again.",
  crm: "All your DMs from Instagram, Facebook, and LinkedIn in one unified inbox. Filter by unread, starred, or lead score.",
  analytics: "Track your pipeline from awareness to close. See conversion rates, response times, and which templates perform best.",
  templates: "Pre-built templates for cold outreach, follow-ups, objection handling, and closing. Save your best messages as reusable templates.",
  outreach: "Define target criteria and let AI generate personalized opening messages. Batch send with smart scheduling to avoid platform flags.",
};

/* ─── Plans ─── */
const plans = [
  { id: "starter", name: "Starter", price: 29, icon: Zap, features: ["500 leads", "10 AI/day", "1 account", "Basic analytics"], popular: false },
  { id: "growth", name: "Growth", price: 79, icon: Rocket, features: ["5,000 leads", "Unlimited AI", "5 accounts", "Team of 3", "7-day free trial"], popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, icon: Crown, features: ["Unlimited leads", "Unlimited AI", "Unlimited accounts", "Unlimited team", "API access"], popular: false },
];

/* ─── Main Component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeFeature, setActiveFeature] = useState("scoring");
  const [activeSolution, setActiveSolution] = useState("scoring");
  const ActiveMockup = FEATURE_MOCKUPS[activeFeature];

  const handleGetStarted = () => navigate(user ? "/dashboard" : "/login");
  const handleGoogleSignIn = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ━━━ Navbar ━━━ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-primary-foreground" /></div>
            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>GoSocial</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
            <a href="#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Solutions</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <Button onClick={() => navigate("/dashboard")} data-testid="nav-dashboard-btn" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-9 px-5 rounded-full">
                Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} data-testid="nav-login-btn" className="text-muted-foreground hover:text-foreground text-sm h-9 font-medium">Log in</Button>
                <Button onClick={handleGetStarted} data-testid="nav-get-started-btn"
                  className="text-white font-bold text-sm h-10 px-6 rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
                  <ArrowRight className="w-4 h-4 mr-2" /> Start for free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ━━━ Hero ━━━ */}
      <section className="pt-28 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Grow your revenue with{" "}
            <span className="inline-flex items-center"><Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-violet-500 mr-1" /><span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">AI-Powered</span></span>
            {" "}social selling platform.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Score leads, automate DM responses, and close deals faster — all from one platform built for creators who sell on social.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Button onClick={handleGetStarted} data-testid="hero-cta-btn"
              className="text-white font-bold text-base h-14 px-10 rounded-full shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
              <ArrowRight className="w-5 h-5 mr-2" /> Start free trial
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-8">7 days free trial. No Credit Card Required.</p>
          <div className="flex items-center justify-center gap-1.5 mb-12">
            {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= 4 ? "text-amber-400 fill-amber-400" : "text-amber-300 fill-amber-300"}`} />)}
            <span className="text-sm font-bold text-foreground ml-1">4.8</span>
            <span className="text-xs text-muted-foreground ml-1">from 200+ creators</span>
          </div>
        </div>
      </section>

      {/* ━━━ Product Screenshot ━━━ */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
              <div className="flex-1 mx-4"><div className="h-6 bg-background rounded-md flex items-center px-3"><span className="text-[10px] text-muted-foreground">app.gosocial.io/dashboard</span></div></div>
            </div>
            <img src={HERO_IMG} alt="GoSocial Dashboard" className="w-full" data-testid="hero-product-image" />
          </div>
        </div>
      </section>

      {/* ━━━ Trust Bar ━━━ */}
      <section className="py-10 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-bold mb-6">Trusted by creators selling on</p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-40">
            {["Instagram", "Facebook", "LinkedIn", "Twitter/X", "TikTok"].map(p => (
              <span key={p} className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Transforming businesses with our solutions
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="solutions" className="relative py-24 px-6 overflow-hidden bg-card" style={{ background: "var(--solutions-bg, inherit)" }}>
        {/* Light streaks */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.02) 0%, transparent 30%), linear-gradient(200deg, rgba(255,255,255,0.015) 0%, transparent 25%)" }} />
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Transforming businesses<br />with our solutions
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Businesses are achieving growth at a greater pace with our AI-powered social selling platform.
            </p>
          </div>

          {/* Solution Tabs */}
          <div className="flex items-center justify-center gap-6 md:gap-16 mb-10" data-testid="solution-tabs">
            {solutionTabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveSolution(tab.key)} data-testid={`solution-tab-${tab.key}`}
                className={`relative pb-3 text-base font-semibold transition-colors ${activeSolution === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
                {activeSolution === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />}
              </button>
            ))}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6" data-testid="solution-stats">
            {solutionStats[activeSolution].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-8 bg-gradient-to-br ${stat.color} transition-all duration-300`} data-testid={`stat-card-${i}`}>
                <p className="text-4xl sm:text-5xl font-extrabold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
                <p className="text-sm text-white/80 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Banner */}
          <div className="rounded-2xl p-8 md:p-10 bg-gradient-to-br from-violet-600/80 to-purple-800/80 backdrop-blur-sm" data-testid="solution-banner">
            <p className="text-base md:text-lg text-white/90 text-center leading-relaxed max-w-3xl mx-auto">
              {solutionBanners[activeSolution]}
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: AI Sales Copilot — Bento Grid
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 px-6 relative overflow-hidden bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              AI Sales Copilot for better,<br />faster & smarter conversations
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Meet the next evolution of social selling: AI-powered reply suggestions that go beyond templates to drive leads, boost engagement, and help creators close efficiently.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="ai-bento-grid">
            {/* Large card - spans 2 cols */}
            <div className="md:col-span-2 rounded-2xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a, #fbbf24)" }}>
              <h3 className="text-lg font-bold text-amber-900 mb-2">Smart Reply Suggestions</h3>
              <p className="text-sm text-amber-800/80 mb-6 max-w-md">
                Create personalized replies effortlessly with our AI that analyzes conversation context and suggests the perfect response.
              </p>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50">
                <div className="space-y-2">
                  {["Casual: Hey! Love what you're building...", "Professional: Thank you for your interest, I'd be happy to...", "Direct: Here's exactly what we can offer..."].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/80 border border-amber-100">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-900">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Icon card */}
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, #ddd6fe, #c4b5fd)" }}>
              <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-violet-700" />
              </div>
              <h3 className="text-lg font-bold text-violet-900 mb-2">Conversation Intelligence</h3>
              <p className="text-sm text-violet-700/80">AI understands context, tone, and intent to provide relevant suggestions.</p>
            </div>

            {/* Small card */}
            <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
              <h3 className="text-lg font-bold text-emerald-900 mb-2">Lead Scoring Engine</h3>
              <p className="text-sm text-emerald-800/80 mb-4">
                Automatically score and prioritize every lead based on engagement, followers, and behavior patterns.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["SM", "JW", "AP"].map((n, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-emerald-100">{n}</div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[85, 92, 88].map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-800 font-bold">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Center card */}
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, #bfdbfe, #93c5fd)" }}>
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-blue-800" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Multi-Platform Support</h3>
              <p className="text-sm text-blue-800/80">Seamlessly integrate with Instagram, Facebook, LinkedIn, and Twitter in one place.</p>
            </div>

            {/* Right card */}
            <div className="rounded-2xl p-8" style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)" }}>
              <h3 className="text-lg font-bold text-pink-900 mb-2">Template Library</h3>
              <p className="text-sm text-pink-800/80 mb-4">
                Pre-built and custom templates for every stage of the sales funnel.
              </p>
              <div className="space-y-2">
                {["Cold Outreach", "Follow-Up", "Objection Handling", "Closing"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-pink-800">
                    <Check className="w-3.5 h-3.5 text-pink-600" />{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Unified Smart CRM
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 px-6 relative overflow-hidden bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Unified smart CRM powered by<br />social messaging
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              GoSocial CRM is an omnichannel powerhouse, blending DM management with advanced AI tools to deliver seamless, personalized sales support for creators and entrepreneurs alike.
            </p>
          </div>

          {/* CRM Feature Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="crm-bento-grid">
            {/* Large card */}
            <div className="md:col-span-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
              <div className="p-6 pb-3">
                <h3 className="text-lg font-bold text-foreground mb-1">Centralized inbox</h3>
                <p className="text-sm text-muted-foreground">Effortlessly engage and respond with seamless messaging across platforms.</p>
              </div>
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-border bg-muted p-4 space-y-2">
                  {[
                    { name: "Sarah Mitchell", msg: "What packages do you offer?", time: "2m", unread: true },
                    { name: "James Wilson", msg: "Can you send case studies?", time: "15m", unread: true },
                    { name: "Aisha Patel", msg: "I spend hours on DMs every day.", time: "1h", unread: false },
                  ].map((c, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{c.name.split(" ").map(n => n[0]).join("")}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground truncate">{c.name}</p><p className="text-[10px] text-muted-foreground truncate">{c.msg}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                        {c.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Channel Integration */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(160deg, #1e3a5f, #1e40af)" }}>
              <h3 className="text-lg font-bold mb-2">Channel integration</h3>
              <p className="text-sm text-blue-200/80 mb-6">Connect Instagram, Facebook, LinkedIn, and more to manage all your conversations in one place seamlessly.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {["IG", "FB", "LI", "TW"].map((p, i) => (
                  <div key={i} className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/10">{p}</div>
                ))}
              </div>
            </div>

            {/* Analytics Card */}
            <div className="rounded-2xl bg-card border border-border shadow-lg p-6">
              <h3 className="text-lg font-bold text-foreground mb-1">Pipeline analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">Track every stage from first contact to closed deal.</p>
              <div className="space-y-2">
                {[{ stage: "New", pct: 100 }, { stage: "Contacted", pct: 72 }, { stage: "Qualified", pct: 48 }, { stage: "Closed", pct: 18 }].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-16">{s.stage}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} /></div>
                    <span className="text-[10px] font-bold text-foreground">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Scoring */}
            <div className="rounded-2xl bg-card border border-border shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-violet-500" /></div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">AI Lead Scoring</h3>
              <p className="text-sm text-muted-foreground">Automatically rank prospects based on conversion likelihood with AI analysis.</p>
            </div>

            {/* Outreach */}
            <div className="rounded-2xl bg-card border border-border shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Send className="w-5 h-5 text-emerald-500" /></div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Smart Outreach</h3>
              <p className="text-sm text-muted-foreground">AI-personalized opening messages at scale with smart scheduling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Everything you need in one place (Features)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-24 px-6 relative overflow-hidden bg-card" style={{ background: "var(--features-bg, inherit)" }}>
        {/* Light streaks */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)" }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <Badge className="bg-muted text-muted-foreground border-border text-xs px-4 py-1 mb-4 uppercase tracking-widest font-bold">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Everything you need in one place
            </h2>
            <p className="text-base text-muted-foreground mt-3 max-w-xl mx-auto">
              GoSocial delivers AI-powered lead scoring, seamless inbox management, and advanced outreach tools. Perfect for creators, yet versatile across industries.
            </p>
          </div>

          {/* Feature Pill Tabs */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap" data-testid="feature-tabs">
            {featureTabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveFeature(tab.key)} data-testid={`feature-tab-${tab.key}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeFeature === tab.key
                    ? "text-white shadow-lg"
                    : "bg-muted text-muted-foreground border border-border hover:text-foreground hover:border-border"
                }`}
                style={activeFeature === tab.key ? { background: "linear-gradient(135deg, #7c3aed, #3b82f6)" } : {}}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Feature Description */}
          <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto mb-8">{FEATURE_DESC[activeFeature]}</p>

          {/* Feature Mockup in Browser Frame */}
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /></div>
                <div className="flex-1 mx-4"><div className="h-5 bg-background rounded flex items-center px-3"><span className="text-[9px] text-muted-foreground">app.gosocial.io/{activeFeature === "scoring" ? "leads" : activeFeature === "copilot" ? "crm" : activeFeature}</span></div></div>
              </div>
              <div className="p-4 min-h-[320px]" data-testid="feature-mockup-content">
                <ActiveMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Pricing
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Simple, transparent pricing</h2>
            <p className="text-base text-muted-foreground mt-3">Start with a 7-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} data-testid={`landing-plan-${plan.id}`}
                className={`relative transition-all hover:-translate-y-1 ${plan.popular
                  ? "border-2 border-primary shadow-xl shadow-primary/10 bg-card"
                  : "border border-border bg-card"}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="text-white text-[10px] px-3 py-0.5" style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>Most Popular</Badge></div>}
                <CardContent className="p-6 pt-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan.popular ? "bg-primary" : "bg-muted"}`}>
                      <plan.icon className={`w-4 h-4 ${plan.popular ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <span className="text-base font-bold text-foreground">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className={`w-4 h-4 shrink-0 ${plan.popular ? "text-primary" : "text-emerald-500"}`} />{f}</li>
                    ))}
                  </ul>
                  <Button onClick={handleGetStarted} data-testid={`landing-subscribe-${plan.id}`}
                    className={`w-full h-11 font-bold rounded-full ${plan.popular
                      ? "text-white shadow-lg"
                      : "bg-muted hover:bg-accent text-foreground border border-border"}`}
                    style={plan.popular ? { background: "linear-gradient(135deg, #7c3aed, #3b82f6)" } : {}}>
                    {plan.popular ? "Start Free Trial" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Final CTA — "Step into the era..."
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 px-6 relative overflow-hidden bg-card" style={{ background: "var(--cta-bg, inherit)" }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Step into the era of<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">AI-driven social selling!</span>
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto">Join creators already converting followers into customers with the power of AI.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGetStarted} data-testid="final-cta-btn"
              className="text-white font-bold text-base h-14 px-10 rounded-full shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
              <ArrowRight className="w-5 h-5 mr-2" /> Start free trial
            </Button>
            <Button variant="outline" onClick={handleGoogleSignIn} data-testid="final-google-btn"
              className="bg-transparent border-border text-muted-foreground hover:bg-accent font-medium h-14 px-8 rounded-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">7 days free trial. No Credit Card Required.</p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SECTION: Footer — Multi-Column
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="py-16 px-6 bg-card border-t border-border" data-testid="landing-footer">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Products */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Products</h4>
              <ul className="space-y-2.5">
                {["AI Copilot", "Lead Scoring", "CRM Inbox", "Templates", "Outreach", "All Features"].map((l, i) => (
                  <li key={i}><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Channels */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Channels</h4>
              <ul className="space-y-2.5">
                {["Instagram", "Facebook", "LinkedIn", "Twitter/X", "WhatsApp"].map((l, i) => (
                  <li key={i}><span className="text-sm text-muted-foreground">{l}</span></li>
                ))}
              </ul>
            </div>
            {/* Solutions */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Solutions</h4>
              <ul className="space-y-2.5">
                {["Lead Generation", "Sales Automation", "Customer Engagement", "E-commerce", "Coaching"].map((l, i) => (
                  <li key={i}><a href="#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            {/* GoSocial */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">GoSocial</h4>
              <ul className="space-y-2.5">
                {["About Us", "Contact", "Careers"].map((l, i) => (
                  <li key={i}><span className="text-sm text-muted-foreground">{l}</span></li>
                ))}
                <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {["Product Guide", "Integrations", "Developer API"].map((l, i) => (
                  <li key={i}><span className="text-sm text-muted-foreground">{l}</span></li>
                ))}
                <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-primary-foreground" /></div>
              <div>
                <span className="text-sm font-bold text-foreground">GoSocial</span>
                <p className="text-xs text-muted-foreground">AI-powered social selling platform</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground">Privacy Policy</span>
              <span className="text-xs text-muted-foreground">Terms of Service</span>
              <span className="text-xs text-muted-foreground">GDPR</span>
            </div>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GoSocial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
