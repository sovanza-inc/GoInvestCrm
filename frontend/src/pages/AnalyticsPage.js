import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const PLATFORM_COLORS = { instagram: "#e1306c", facebook: "#1877f2", linkedin: "#0a66c2", twitter: "#1da1f2" };

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <span className="font-bold text-white">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ovR, pipR] = await Promise.all([api.get("/analytics/overview"), api.get("/analytics/pipeline")]);
        setOverview(ovR.data);
        setPipeline(pipR.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading analytics...</div>;

  const pipelineData = pipeline ? Object.entries(pipeline.pipeline).map(([k, v], i) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: COLORS[i % COLORS.length] })) : [];
  const platformData = pipeline ? Object.entries(pipeline.platform_distribution).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: PLATFORM_COLORS[k] || "#3b82f6" })) : [];
  const monthlyData = pipeline?.monthly_data || [];

  const funnelData = pipelineData.filter(d => !["lost"].includes(d.name.toLowerCase()));
  const kpis = overview ? [
    { label: "Total Leads", value: overview.total_leads },
    { label: "Qualified", value: overview.qualified_leads },
    { label: "Active Chats", value: overview.active_conversations },
    { label: "Conversion", value: `${overview.conversion_rate}%` },
    { label: "Hot Leads", value: overview.hot_leads },
    { label: "Warm Leads", value: overview.warm_leads },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Performance insights and pipeline metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        {kpis.map((k, i) => (
          <Card key={i} className="stat-card bg-slate-900/50" data-testid={`analytics-kpi-${i}`}>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{k.label}</p>
              <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Funnel */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-white">Sales Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-white">Platform Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {platformData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {platformData.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                  <span className="text-slate-400">{p.name}</span>
                  <span className="font-bold text-white">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-white">Monthly Lead Acquisition</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
