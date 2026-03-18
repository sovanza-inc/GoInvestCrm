import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Link2, Bell, Shield, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const PLAN_NAMES = { starter: "Starter", growth: "Growth", enterprise: "Enterprise", free: "Free" };

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [setRes, subRes] = await Promise.all([
          api.get("/settings"),
          api.get("/billing/subscription"),
        ]);
        setSettings(setRes.data);
        setSubscription(subRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await api.put("/settings", { [key]: value });
      toast.success("Settings updated");
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <CardTitle className="text-base font-semibold text-foreground">Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Name</Label>
              <Input data-testid="settings-name-input" disabled value={user?.name || ""} className="bg-slate-950/50 border-border text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Email</Label>
              <Input data-testid="settings-email-input" disabled value={user?.email || ""} className="bg-slate-950/50 border-border text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Company</Label>
            <Input data-testid="settings-company-input" disabled value={user?.company || "Not set"} className="bg-slate-950/50 border-border text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <CardTitle className="text-base font-semibold text-foreground">Subscription</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/30 border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {PLAN_NAMES[subscription?.plan] || "Free"}
                {subscription?.status === 'active' && (
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
                )}
                {subscription?.status === 'trial' && (
                  <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                    Trial - {subscription.days_remaining} days left
                  </Badge>
                )}
                {subscription?.status === 'expired' && (
                  <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Trial Expired</Badge>
                )}
              </p>
              {subscription?.started && (
                <p className="text-xs text-muted-foreground mt-1">Since {new Date(subscription.started).toLocaleDateString()}</p>
              )}
              {subscription?.plan_details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {subscription.plan_details.leads_limit === -1 ? "Unlimited" : subscription.plan_details.leads_limit} leads &middot;
                  {subscription.plan_details.ai_daily_limit === -1 ? " Unlimited" : ` ${subscription.plan_details.ai_daily_limit}`} AI/day &middot;
                  {subscription.plan_details.team_limit === -1 ? " Unlimited" : ` ${subscription.plan_details.team_limit}`} team
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" data-testid="manage-subscription-btn"
              onClick={() => navigate("/pricing")}
              className="text-blue-400 hover:text-blue-300 text-xs">
              {subscription?.plan === 'free' ? 'Upgrade' : 'Manage'} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {subscription?.transactions?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Recent Payments</p>
              {subscription.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{PLAN_NAMES[tx.plan_id] || tx.plan_id}</span>
                    <Badge variant="outline" className={`text-[9px] ${tx.payment_status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                      {tx.payment_status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">${tx.amount}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-base font-semibold text-foreground">Connected Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Instagram", status: "mock", color: "text-pink-400" },
            { name: "Facebook", status: "mock", color: "text-blue-400" },
            { name: "LinkedIn", status: "coming_soon", color: "text-sky-400" },
            { name: "Twitter/X", status: "coming_soon", color: "text-cyan-400" },
          ].map((acc) => (
            <div key={acc.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-border"
              data-testid={`connected-account-${acc.name.toLowerCase()}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${acc.color}`}>{acc.name}</span>
              </div>
              {acc.status === "mock" ? (
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Demo Mode</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Coming Soon</Badge>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-2">Social accounts are in demo mode for MVP. Real OAuth integration coming in Phase 2.</p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-base font-semibold text-foreground">Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Receive alerts for new messages and leads</p>
            </div>
            <Switch data-testid="notifications-toggle"
              checked={settings?.notifications_enabled}
              onCheckedChange={(v) => updateSetting('notifications_enabled', v)} />
          </div>
          <Separator className="bg-card" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto AI Scoring</p>
              <p className="text-xs text-muted-foreground">Automatically score new leads with AI</p>
            </div>
            <Switch data-testid="auto-score-toggle"
              checked={settings?.auto_score}
              onCheckedChange={(v) => updateSetting('auto_score', v)} />
          </div>
          <Separator className="bg-card" />
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Daily Outreach Limit</Label>
            <Input type="number" data-testid="outreach-limit-input"
              className="bg-slate-950/50 border-border text-foreground w-32"
              value={settings?.daily_outreach_limit || 50}
              onChange={e => updateSetting('daily_outreach_limit', parseInt(e.target.value) || 50)} />
            <p className="text-xs text-muted-foreground">Maximum automated messages per day</p>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-base font-semibold text-foreground">Data & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is encrypted and stored securely. We respect platform ToS and never access your accounts beyond the permissions you grant.
            GDPR compliant. You can request data export or deletion at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
