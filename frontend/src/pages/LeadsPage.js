import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Sparkles, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = { new: "bg-slate-600", contacted: "bg-blue-600", qualified: "bg-emerald-600", negotiation: "bg-amber-600", closed: "bg-green-600", lost: "bg-red-600" };
const scoreColor = (s) => s >= 70 ? "text-emerald-400" : s >= 40 ? "text-amber-400" : "text-blue-400";
const scoreLabel = (s) => s >= 70 ? "Hot" : s >= 40 ? "Warm" : "Cold";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [scoring, setScoring] = useState(null);
  const [newLead, setNewLead] = useState({ name: "", handle: "", platform: "instagram", bio: "", followers: 0, engagement_rate: 0, tags: "", notes: "" });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (platformFilter !== "all") params.platform = platformFilter;
      const res = await api.get("/leads", { params });
      setLeads(res.data.leads);
      setTotal(res.data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search, statusFilter, platformFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const addLead = async (e) => {
    e.preventDefault();
    try {
      await api.post("/leads", { ...newLead, tags: newLead.tags ? newLead.tags.split(",").map(t => t.trim()) : [] });
      toast.success("Lead added");
      setShowAdd(false);
      setNewLead({ name: "", handle: "", platform: "instagram", bio: "", followers: 0, engagement_rate: 0, tags: "", notes: "" });
      fetchLeads();
    } catch (err) { toast.error("Failed to add lead"); }
  };

  const deleteLead = async (id) => {
    try { await api.delete(`/leads/${id}`); toast.success("Lead deleted"); fetchLeads(); }
    catch { toast.error("Failed to delete"); }
  };

  const aiScore = async (id) => {
    setScoring(id);
    try {
      const res = await api.post("/ai/score-lead", { lead_id: id });
      toast.success(`Score: ${res.data.score} (${res.data.category})`);
      fetchLeads();
    } catch { toast.error("Scoring failed"); }
    finally { setScoring(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Leads</h1>
          <p className="text-sm text-slate-400 mt-1">{total} total leads</p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="add-lead-btn"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search leads..." data-testid="leads-search-input"
              className="pl-9 bg-slate-950/50 border-slate-700 h-10 text-slate-200 placeholder:text-slate-600"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="leads-status-filter">
            <SelectTrigger className="w-40 bg-slate-950/50 border-slate-700 text-slate-300"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter} data-testid="leads-platform-filter">
            <SelectTrigger className="w-40 bg-slate-950/50 border-slate-700 text-slate-300"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-testid="leads-table">
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Lead</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Platform</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Score</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Tags</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Followers</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No leads found</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`} className="border-slate-800/50 hover:bg-slate-800/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={lead.avatar} alt={lead.name} className="w-8 h-8 rounded-full bg-slate-700" />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{lead.name}</p>
                        <p className="text-xs text-slate-500">@{lead.handle}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] platform-${lead.platform}`}>{lead.platform}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreColor(lead.score)}`}>{lead.score}</span>
                      <span className={`text-[10px] ${scoreColor(lead.score)}`}>{scoreLabel(lead.score)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${STATUS_COLORS[lead.status] || 'bg-slate-600'}`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.slice(0, 2).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-slate-400 border-slate-700">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">{lead.followers?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-400 hover:text-violet-300"
                        onClick={() => aiScore(lead.id)} disabled={scoring === lead.id}
                        data-testid={`ai-score-btn-${lead.id}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => deleteLead(lead.id)} data-testid={`delete-lead-btn-${lead.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Lead Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Add New Lead</DialogTitle></DialogHeader>
          <form onSubmit={addLead} className="space-y-4" data-testid="add-lead-form">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Name</Label>
                <Input data-testid="lead-name-input" className="bg-slate-950/50 border-slate-700 text-slate-200" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} required /></div>
              <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Handle</Label>
                <Input data-testid="lead-handle-input" className="bg-slate-950/50 border-slate-700 text-slate-200" value={newLead.handle} onChange={e => setNewLead({...newLead, handle: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Platform</Label>
                <Select value={newLead.platform} onValueChange={v => setNewLead({...newLead, platform: v})}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="instagram">Instagram</SelectItem><SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Followers</Label>
                <Input type="number" className="bg-slate-950/50 border-slate-700 text-slate-200" value={newLead.followers} onChange={e => setNewLead({...newLead, followers: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Engagement Rate (%)</Label>
              <Input type="number" step="0.1" className="bg-slate-950/50 border-slate-700 text-slate-200" value={newLead.engagement_rate} onChange={e => setNewLead({...newLead, engagement_rate: parseFloat(e.target.value) || 0})} /></div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Bio</Label>
              <Textarea className="bg-slate-950/50 border-slate-700 text-slate-200 h-16" value={newLead.bio} onChange={e => setNewLead({...newLead, bio: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Tags (comma separated)</Label>
              <Input className="bg-slate-950/50 border-slate-700 text-slate-200" value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} placeholder="interested, high-value" /></div>
            <Button type="submit" data-testid="submit-lead-btn" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">Add Lead</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
