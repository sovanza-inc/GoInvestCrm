import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Link2, Bell, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <CardTitle className="text-base font-semibold text-white">Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Name</Label>
              <Input data-testid="settings-name-input" disabled value={user?.name || ""} className="bg-slate-950/50 border-slate-700 text-slate-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Email</Label>
              <Input data-testid="settings-email-input" disabled value={user?.email || ""} className="bg-slate-950/50 border-slate-700 text-slate-300" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Company</Label>
            <Input data-testid="settings-company-input" disabled value={user?.company || "Not set"} className="bg-slate-950/50 border-slate-700 text-slate-300" />
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-base font-semibold text-white">Connected Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Instagram", status: "mock", color: "text-pink-400" },
            { name: "Facebook", status: "mock", color: "text-blue-400" },
            { name: "LinkedIn", status: "coming_soon", color: "text-sky-400" },
            { name: "Twitter/X", status: "coming_soon", color: "text-cyan-400" },
          ].map((acc) => (
            <div key={acc.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-800/50"
              data-testid={`connected-account-${acc.name.toLowerCase()}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${acc.color}`}>{acc.name}</span>
              </div>
              {acc.status === "mock" ? (
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Demo Mode</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">Coming Soon</Badge>
              )}
            </div>
          ))}
          <p className="text-xs text-slate-600 mt-2">Social accounts are in demo mode for MVP. Real OAuth integration coming in Phase 2.</p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-base font-semibold text-white">Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Notifications</p>
              <p className="text-xs text-slate-500">Receive alerts for new messages and leads</p>
            </div>
            <Switch data-testid="notifications-toggle"
              checked={settings?.notifications_enabled}
              onCheckedChange={(v) => updateSetting('notifications_enabled', v)} />
          </div>
          <Separator className="bg-slate-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Auto AI Scoring</p>
              <p className="text-xs text-slate-500">Automatically score new leads with AI</p>
            </div>
            <Switch data-testid="auto-score-toggle"
              checked={settings?.auto_score}
              onCheckedChange={(v) => updateSetting('auto_score', v)} />
          </div>
          <Separator className="bg-slate-800" />
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Daily Outreach Limit</Label>
            <Input type="number" data-testid="outreach-limit-input"
              className="bg-slate-950/50 border-slate-700 text-slate-200 w-32"
              value={settings?.daily_outreach_limit || 50}
              onChange={e => updateSetting('daily_outreach_limit', parseInt(e.target.value) || 50)} />
            <p className="text-xs text-slate-600">Maximum automated messages per day</p>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-base font-semibold text-white">Data & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your data is encrypted and stored securely. We respect platform ToS and never access your accounts beyond the permissions you grant.
            GDPR compliant. You can request data export or deletion at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
