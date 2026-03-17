import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, MessageSquare, BarChart3, Sparkles, Target, ArrowRight, Check, Shield, Clock } from "lucide-react";

const features = [
  { icon: Users, title: "Lead Intelligence", desc: "AI-powered scoring identifies your hottest prospects from casual followers. Focus on leads that convert." },
  { icon: Sparkles, title: "AI Sales Copilot", desc: "Get 3 AI-generated reply suggestions for every conversation. Casual, professional, or direct - you choose." },
  { icon: MessageSquare, title: "Unified CRM Inbox", desc: "Manage all your DMs across Instagram, Facebook, LinkedIn in one place. Never lose a lead again." },
  { icon: BarChart3, title: "Pipeline Analytics", desc: "Track your funnel from awareness to close. See conversion rates, response times, and top performers." },
  { icon: Target, title: "Smart Templates", desc: "Pre-built message templates for cold outreach, follow-ups, objection handling, and closing. Personalize at scale." },
  { icon: Shield, title: "Platform Safe", desc: "Respects rate limits and ToS. No account flags. Smart scheduling keeps your accounts secure." },
];

const steps = [
  { num: "01", title: "Connect your accounts", desc: "Link your social profiles in seconds. We sync your followers and DM history." },
  { num: "02", title: "Let AI score your leads", desc: "Our AI analyzes engagement, bio, and activity to score every follower 1-100." },
  { num: "03", title: "Close deals faster", desc: "Use AI suggestions to respond perfectly. Track everything in your pipeline." },
];

const plans = [
  { id: "starter", name: "Starter", price: 29, features: ["500 leads", "10 AI/day", "1 account", "Basic analytics"], popular: false },
  { id: "growth", name: "Growth", price: 79, features: ["5,000 leads", "Unlimited AI", "5 accounts", "Team of 3", "7-day free trial"], popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, features: ["Unlimited leads", "Unlimited AI", "Unlimited accounts", "Unlimited team", "API access"], popular: false },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) { navigate("/dashboard"); return; }
    navigate("/login");
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleSignIn = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-surface" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>GoSocial</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} data-testid="nav-dashboard-btn"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-9 px-4">
                Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} data-testid="nav-login-btn"
                  className="text-slate-400 hover:text-white text-sm h-9">Sign In</Button>
                <Button onClick={handleGetStarted} data-testid="nav-get-started-btn"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-9 px-4">
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <Badge className="mb-6 bg-blue-600/10 text-blue-400 border-blue-500/20 text-xs px-4 py-1.5">
            <Clock className="w-3 h-3 mr-1.5" /> 7-day free trial on Growth plan
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6"
            style={{ fontFamily: 'Outfit, sans-serif' }}>
            Turn Followers Into
            <span className="text-blue-400"> Paying Customers</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered sales assistant for creators. Score leads, get reply suggestions, and manage your entire sales pipeline from social DMs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGetStarted} data-testid="hero-cta-btn"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base h-12 px-8 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={handleGoogleSignIn} data-testid="hero-google-btn"
              className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-base h-12 px-8">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Creators" },
            { value: "250K+", label: "Leads Scored" },
            { value: "40%", label: "Avg Conversion" },
            { value: "3x", label: "Faster Response" },
          ].map((s, i) => (
            <div key={i} data-testid={`stat-${i}`}>
              <p className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Everything you need to sell on social
            </h2>
            <p className="text-base text-slate-400 mt-3 max-w-xl mx-auto">Built for creators who sell through DMs. Not another enterprise CRM.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {features.map((f, i) => (
              <div key={i} data-testid={`feature-card-${i}`}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Up and running in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} data-testid={`step-${i}`} className="text-center md:text-left">
                <span className="text-5xl font-extrabold text-blue-600/20" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.num}</span>
                <h3 className="text-lg font-semibold text-white mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-base text-slate-400 mt-3">Start with a 7-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} data-testid={`landing-plan-${plan.id}`}
                className={`relative p-6 rounded-xl border transition-all hover:-translate-y-1 ${
                  plan.popular ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-slate-900/50" : "border-slate-800 bg-slate-900/30"
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white text-[10px] px-3 py-0.5">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>${plan.price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className={`w-4 h-4 shrink-0 ${plan.popular ? "text-blue-400" : "text-emerald-400"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleGetStarted} data-testid={`landing-subscribe-${plan.id}`}
                  className={`w-full h-10 font-bold ${
                    plan.popular ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}>
                  {plan.popular ? "Start Free Trial" : "Get Started"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to grow your revenue?
          </h2>
          <p className="text-base text-slate-400 mb-8">Join thousands of creators already converting followers into customers.</p>
          <Button onClick={handleGetStarted} data-testid="final-cta-btn"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base h-12 px-8 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            Start Your 7-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">GoSocial</span>
          </div>
          <p className="text-xs text-slate-600">AI-powered social selling platform for creators</p>
        </div>
      </footer>
    </div>
  );
}
