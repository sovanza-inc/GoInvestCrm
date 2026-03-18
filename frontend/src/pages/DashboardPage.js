import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, TrendingUp, Target, Database, ArrowRight, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const SCORE_COLORS = { hot: "#10b981", warm: "#f59e0b", cold: "#3b82f6" };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      const [ovRes, pipRes, convRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/pipeline"),
        api.get("/conversations?limit=5"),
      ]);
      setOverview(ovRes.data);
      setPipeline(pipRes.data);
      setConversations(convRes.data.conversations?.slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const seedData = async () => {
    setSeeding(true);
    try {
      const res = await api.post("/seed-data");
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;

  const isEmpty = overview?.total_leads === 0;
  const pipelineData = pipeline ? Object.entries(pipeline.pipeline).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })) : [];
  const scoreData = overview ? [
    { name: "Hot", value: overview.hot_leads, color: SCORE_COLORS.hot },
    { name: "Warm", value: overview.warm_leads, color: SCORE_COLORS.warm },
    { name: "Cold", value: overview.cold_leads, color: SCORE_COLORS.cold },
  ] : [];

  const stats = overview ? [
    { label: "Total Leads", value: overview.total_leads, icon: Users, accent: "text-blue-400" },
    { label: "Qualified Leads", value: overview.qualified_leads, icon: Target, accent: "text-emerald-400" },
    { label: "Active Conversations", value: overview.active_conversations, icon: MessageSquare, accent: "text-amber-400" },
    { label: "Conversion Rate", value: `${overview.conversion_rate}%`, icon: TrendingUp, accent: "text-violet-400" },
  ] : [];

  const tooltipStyle = theme === "dark"
    ? { background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 20%)', borderRadius: 8, color: '#f8fafc', fontSize: 12 }
    : { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12 };
  const axisColor = theme === "dark" ? "#a1a1aa" : "#71717a";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your sales pipeline at a glance</p>
        </div>
        {isEmpty && (
          <Button onClick={seedData} disabled={seeding} data-testid="seed-data-btn"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Database className="w-4 h-4 mr-2" /> {seeding ? "Seeding..." : "Load Demo Data"}
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="bg-card border-border" data-testid={`stat-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
                <s.icon className={`w-5 h-5 ${s.accent}`} />
              </div>
              <p className="text-3xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipelineData}>
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Lead Quality</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={scoreData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {scoreData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {scoreData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Recent Conversations</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/crm")} data-testid="view-all-conversations-btn"
            className="text-primary hover:text-primary/80 text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No conversations yet. Seed demo data to get started.</p>
          ) : conversations.map((c) => (
            <div key={c.id} data-testid={`recent-conv-${c.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate("/crm")}
            >
              <img src={c.lead_avatar} alt={c.lead_name} className="w-9 h-9 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{c.lead_name}</span>
                  {c.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">{c.platform}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {c.unread_count}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
