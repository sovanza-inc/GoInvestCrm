import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const PLAN_ICONS = { starter: Zap, growth: Rocket, enterprise: Crown };
const PLAN_FEATURES = {
  starter: ["Up to 500 leads", "10 AI suggestions/day", "1 connected account", "Basic analytics", "Email support"],
  growth: ["Up to 5,000 leads", "Unlimited AI suggestions", "5 connected accounts", "Team of 3 members", "Advanced analytics", "Priority support"],
  enterprise: ["Unlimited leads", "Unlimited AI suggestions", "Unlimited accounts", "Unlimited team members", "Custom AI training", "Dedicated success manager", "API access"],
};

function PlanCard({ plan, currentPlan, onSubscribe, loading }) {
  const Icon = PLAN_ICONS[plan.id] || Zap;
  const features = PLAN_FEATURES[plan.id] || [];
  const isCurrent = currentPlan === plan.id;
  const isPopular = plan.id === "growth";

  return (
    <Card data-testid={`plan-card-${plan.id}`}
      className={`relative bg-slate-900/50 border transition-all hover:-translate-y-1 ${
        isPopular ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-slate-800 hover:border-slate-700"
      }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white text-[10px] px-3 py-0.5">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isPopular ? "bg-blue-600" : "bg-slate-800"
          }`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-bold text-white">{plan.name}</CardTitle>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            ${plan.price}
          </span>
          <span className="text-sm text-slate-500">/month</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2.5 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
              <Check className={`w-4 h-4 shrink-0 ${isPopular ? "text-blue-400" : "text-emerald-400"}`} />
              {f}
            </li>
          ))}
        </ul>
        <Button
          onClick={() => onSubscribe(plan.id)}
          disabled={loading || isCurrent}
          data-testid={`subscribe-btn-${plan.id}`}
          className={`w-full h-11 font-bold ${
            isCurrent
              ? "bg-slate-800 text-slate-400 cursor-not-allowed"
              : isPopular
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? "Current Plan" : "Subscribe"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SuccessView({ sessionId }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [planId, setPlanId] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId || attempts >= 8) return;
    const poll = async () => {
      try {
        const res = await api.get(`/billing/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setStatus("paid");
          setPlanId(res.data.plan_id);
        } else if (res.data.status === "expired") {
          setStatus("expired");
        } else {
          setTimeout(() => setAttempts(prev => prev + 1), 2000);
        }
      } catch {
        setTimeout(() => setAttempts(prev => prev + 1), 2000);
      }
    };
    poll();
  }, [sessionId, attempts]);

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Processing your payment...</h2>
        <p className="text-sm text-slate-400">Please wait while we confirm your subscription</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Welcome to {SUBSCRIPTION_PLANS_NAMES[planId] || "GoSocial"}!
        </h2>
        <p className="text-sm text-slate-400 mb-8">Your subscription is now active</p>
        <Button onClick={() => navigate("/")} data-testid="go-to-dashboard-btn"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-2">Payment status unclear</h2>
      <p className="text-sm text-slate-400 mb-6">Please check your email for confirmation</p>
      <Button onClick={() => navigate("/pricing")} className="bg-slate-800 text-white">
        Back to Pricing
      </Button>
    </div>
  );
}

const SUBSCRIPTION_PLANS_NAMES = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };

export default function PricingPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get("/billing/plans"),
          api.get("/billing/subscription"),
        ]);
        setPlans(plansRes.data.plans);
        setCurrentPlan(subRes.data.plan);
      } catch (err) { console.error(err); }
      finally { setFetching(false); }
    };
    fetch();
  }, []);

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    try {
      const origin = window.location.origin;
      const res = await api.post("/billing/create-checkout", { plan_id: planId, origin_url: origin });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  // If returning from Stripe with session_id
  if (sessionId) {
    return (
      <div className="max-w-2xl mx-auto">
        <SuccessView sessionId={sessionId} />
      </div>
    );
  }

  if (fetching) return <div className="flex items-center justify-center h-64 text-slate-500">Loading plans...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Choose your plan
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          Scale your social selling with the right tools. All plans include core CRM features.
        </p>
        {currentPlan !== "free" && (
          <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Current: {SUBSCRIPTION_PLANS_NAMES[currentPlan] || currentPlan}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id} plan={plan}
            currentPlan={currentPlan}
            onSubscribe={handleSubscribe}
            loading={loading === plan.id}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-600">
          All plans billed monthly. Cancel anytime. 14-day money-back guarantee.
        </p>
      </div>
    </div>
  );
}
