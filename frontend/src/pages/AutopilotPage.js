import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { colors, getStatusColor } from "@/lib/colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap, Plus, Play, Pause, Trash2, Edit, Target, Send,
  BarChart3, Users, ArrowRight, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["new", "contacted", "qualified", "negotiation", "closed", "lost"];
const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "whatsapp"];

export default function AutopilotPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/autopilot/campaigns");
      setCampaigns(res.data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const toggleCampaign = async (id) => {
    try {
      const res = await api.put(`/autopilot/campaigns/${id}/toggle`);
      toast.success(`Campaign ${res.data.status === "active" ? "activated" : "paused"}`);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to toggle campaign");
    }
  };

  const deleteCampaign = async (id) => {
    try {
      await api.delete(`/autopilot/campaigns/${id}`);
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (err) {
      toast.error("Failed to delete campaign");
    }
  };

  const previewCampaign = async (id) => {
    try {
      const res = await api.post(`/autopilot/campaigns/${id}/simulate`);
      setPreviewData(res.data);
      setShowPreview(true);
    } catch (err) {
      toast.error("Failed to preview campaign");
    }
  };

  const viewAnalytics = async (id) => {
    try {
      const res = await api.get(`/autopilot/campaigns/${id}/analytics`);
      setAnalyticsData(res.data);
      setShowAnalytics(true);
    } catch (err) {
      toast.error("Failed to load analytics");
    }
  };

  const statusBadge = (status) => {
    const map = {
      draft: "bg-slate-500/20 text-slate-400",
      active: "bg-emerald-500/20 text-emerald-400",
      paused: "bg-amber-500/20 text-amber-400",
    };
    return map[status] || map.draft;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading campaigns...</div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="autopilot-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Autopilot</h1>
          <p className="text-sm text-muted-foreground mt-1">Create automated outreach sequences for your leads</p>
        </div>
        <Button
          onClick={() => { setEditCampaign(null); setShowCreate(true); }}
          className={colors.ui.primary}
          data-testid="create-campaign-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Target className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">Total Campaigns</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Play className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{campaigns.filter(c => c.status === "active").length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><Send className="w-5 h-5 text-violet-400" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{campaigns.reduce((s, c) => s + (c.stats?.total_sent || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Messages Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><BarChart3 className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{campaigns.reduce((s, c) => s + (c.stats?.total_replied || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Replies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first automated outreach campaign to start engaging leads on autopilot.</p>
            <Button onClick={() => setShowCreate(true)} className={colors.ui.primary} data-testid="empty-create-campaign-btn">
              <Plus className="w-4 h-4 mr-2" /> Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="bg-card border-border" data-testid={`campaign-card-${campaign.id}`}>
              <CardContent className="p-0">
                {/* Campaign Header */}
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`expand-campaign-${campaign.id}`}
                  >
                    {expandedId === campaign.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                      <Badge className={`text-xs ${statusBadge(campaign.status)}`}>{campaign.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{campaign.description || "No description"}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{campaign.steps?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Steps</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{campaign.stats?.total_targeted || 0}</p>
                      <p className="text-xs text-muted-foreground">Targeted</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{campaign.stats?.total_sent || 0}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => toggleCampaign(campaign.id)}
                      className="text-muted-foreground hover:text-foreground"
                      title={campaign.status === "active" ? "Pause" : "Activate"}
                      data-testid={`toggle-campaign-${campaign.id}`}
                    >
                      {campaign.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => previewCampaign(campaign.id)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Preview matching leads"
                      data-testid={`preview-campaign-${campaign.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => viewAnalytics(campaign.id)}
                      className="text-muted-foreground hover:text-foreground"
                      title="View analytics"
                      data-testid={`analytics-campaign-${campaign.id}`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { setEditCampaign(campaign); setShowCreate(true); }}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`edit-campaign-${campaign.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-muted-foreground hover:text-red-400"
                      data-testid={`delete-campaign-${campaign.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === campaign.id && (
                  <div className="border-t border-border p-4 space-y-4 bg-background/50">
                    {/* Target Criteria */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Target Criteria</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.target_criteria?.platforms?.length > 0 && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Platforms: {campaign.target_criteria.platforms.join(", ")}
                          </Badge>
                        )}
                        {campaign.target_criteria?.statuses?.length > 0 && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Status: {campaign.target_criteria.statuses.join(", ")}
                          </Badge>
                        )}
                        {campaign.target_criteria?.min_score != null && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Min Score: {campaign.target_criteria.min_score}
                          </Badge>
                        )}
                        {campaign.target_criteria?.max_score != null && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Max Score: {campaign.target_criteria.max_score}
                          </Badge>
                        )}
                        {campaign.target_criteria?.tags?.length > 0 && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Tags: {campaign.target_criteria.tags.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Steps */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Sequence Steps</h4>
                      <div className="space-y-2">
                        {campaign.steps?.map((step, idx) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{step.message}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-muted-foreground">
                                  {step.delay_hours === 0 ? "Immediately" : `After ${step.delay_hours}h`}
                                </span>
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                  Variant {step.variant}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <CampaignDialog
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        campaign={editCampaign}
        onSaved={fetchCampaigns}
      />

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Campaign Preview</DialogTitle>
            <DialogDescription className="text-muted-foreground">Matching leads for this campaign</DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center p-3 bg-background rounded-lg border border-border flex-1">
                  <p className="text-2xl font-bold text-foreground">{previewData.total_matching}</p>
                  <p className="text-xs text-muted-foreground">Matching Leads</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border border-border flex-1">
                  <p className="text-2xl font-bold text-foreground">{previewData.steps_count}</p>
                  <p className="text-xs text-muted-foreground">Sequence Steps</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Preview Leads (max 20)</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {previewData.preview_leads?.map(lead => (
                    <div key={lead.id} className="flex items-center gap-3 p-2 rounded bg-background border border-border">
                      <img src={lead.avatar} alt="" className="w-7 h-7 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.handle}</p>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(lead.status)}`}>{lead.status}</Badge>
                    </div>
                  ))}
                  {(!previewData.preview_leads || previewData.preview_leads.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No matching leads found. Adjust your targeting criteria.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Campaign Analytics</DialogTitle>
            <DialogDescription className="text-muted-foreground">Performance metrics for this campaign</DialogDescription>
          </DialogHeader>
          {analyticsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border border-border text-center">
                  <p className="text-xl font-bold text-foreground">{analyticsData.overall?.total_targeted || 0}</p>
                  <p className="text-xs text-muted-foreground">Targeted</p>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border text-center">
                  <p className="text-xl font-bold text-foreground">{analyticsData.overall?.total_sent || 0}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border text-center">
                  <p className="text-xl font-bold text-foreground">{analyticsData.overall?.total_replied || 0}</p>
                  <p className="text-xs text-muted-foreground">Replied</p>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border text-center">
                  <p className="text-xl font-bold text-foreground">{analyticsData.overall?.total_converted || 0}</p>
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
              </div>
              {analyticsData.steps?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Per-Step Performance</h4>
                  <div className="space-y-2">
                    {analyticsData.steps.map((step, idx) => (
                      <div key={step.step_id} className="p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground font-medium">Step {idx + 1} (Variant {step.variant})</span>
                          <span className="text-xs text-muted-foreground">{step.reply_rate}% reply rate</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Sent: {step.sent}</span>
                          <span>Replied: {step.replied}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignDialog({ open, onClose, campaign, onSaved }) {
  const isEdit = !!campaign;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState([]);
  const [targetStatuses, setTargetStatuses] = useState([]);
  const [targetMinScore, setTargetMinScore] = useState("");
  const [targetMaxScore, setTargetMaxScore] = useState("");
  const [targetTags, setTargetTags] = useState("");
  const [steps, setSteps] = useState([{ message: "", delay_hours: 0, variant: "A" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || "");
      setDescription(campaign.description || "");
      setTargetPlatforms(campaign.target_criteria?.platforms || []);
      setTargetStatuses(campaign.target_criteria?.statuses || []);
      setTargetMinScore(campaign.target_criteria?.min_score ?? "");
      setTargetMaxScore(campaign.target_criteria?.max_score ?? "");
      setTargetTags((campaign.target_criteria?.tags || []).join(", "));
      setSteps(campaign.steps?.map(s => ({
        message: s.message, delay_hours: s.delay_hours, variant: s.variant || "A"
      })) || [{ message: "", delay_hours: 0, variant: "A" }]);
    } else {
      setName(""); setDescription(""); setTargetPlatforms([]);
      setTargetStatuses([]); setTargetMinScore(""); setTargetMaxScore("");
      setTargetTags(""); setSteps([{ message: "", delay_hours: 0, variant: "A" }]);
    }
  }, [campaign, open]);

  const addStep = () => setSteps([...steps, { message: "", delay_hours: 24, variant: "A" }]);
  const removeStep = (idx) => setSteps(steps.filter((_, i) => i !== idx));
  const updateStep = (idx, field, value) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    setSteps(updated);
  };

  const togglePlatform = (p) => {
    setTargetPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };
  const toggleStatus = (s) => {
    setTargetStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Campaign name is required"); return; }
    if (steps.some(s => !s.message.trim())) { toast.error("All steps need a message"); return; }

    setSaving(true);
    try {
      const payload = {
        name, description,
        target_platforms: targetPlatforms,
        target_statuses: targetStatuses,
        target_min_score: targetMinScore !== "" ? parseInt(targetMinScore) : null,
        target_max_score: targetMaxScore !== "" ? parseInt(targetMaxScore) : null,
        target_tags: targetTags ? targetTags.split(",").map(t => t.trim()).filter(Boolean) : [],
        steps,
      };

      if (isEdit) {
        await api.put(`/autopilot/campaigns/${campaign.id}`, payload);
        toast.success("Campaign updated");
      } else {
        await api.post("/autopilot/campaigns", payload);
        toast.success("Campaign created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define your automated outreach sequence and targeting criteria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5" data-testid="campaign-form">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-foreground">Campaign Name</Label>
              <Input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className="bg-background border-border text-foreground mt-1"
                data-testid="campaign-name-input"
              />
            </div>
            <div>
              <Label className="text-foreground">Description</Label>
              <Input
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this campaign"
                className="bg-background border-border text-foreground mt-1"
                data-testid="campaign-desc-input"
              />
            </div>
          </div>

          {/* Target Criteria */}
          <div className="space-y-3 p-4 rounded-lg bg-background border border-border">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Target Criteria
            </h4>
            <div>
              <Label className="text-muted-foreground text-xs">Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      targetPlatforms.includes(p)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`target-platform-${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Lead Status</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => toggleStatus(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      targetStatuses.includes(s)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`target-status-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Min Score</Label>
                <Input type="number" value={targetMinScore} onChange={e => setTargetMinScore(e.target.value)}
                  placeholder="0" min="0" max="100"
                  className="bg-card border-border text-foreground mt-1"
                  data-testid="target-min-score"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Max Score</Label>
                <Input type="number" value={targetMaxScore} onChange={e => setTargetMaxScore(e.target.value)}
                  placeholder="100" min="0" max="100"
                  className="bg-card border-border text-foreground mt-1"
                  data-testid="target-max-score"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Tags (comma-separated)</Label>
              <Input value={targetTags} onChange={e => setTargetTags(e.target.value)}
                placeholder="e.g., vip, influencer"
                className="bg-card border-border text-foreground mt-1"
                data-testid="target-tags-input"
              />
            </div>
          </div>

          {/* Sequence Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> Sequence Steps
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={addStep}
                className="border-border text-foreground hover:bg-accent"
                data-testid="add-step-btn"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-background border border-border space-y-3" data-testid={`step-${idx}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground">Step {idx + 1}</span>
                    </div>
                    {steps.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(idx)}
                        className="text-muted-foreground hover:text-red-400 h-7 w-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={step.message} onChange={e => updateStep(idx, "message", e.target.value)}
                    placeholder="Type your message... Use {{name}} for lead's name"
                    className="bg-card border-border text-foreground text-sm min-h-[80px]"
                    data-testid={`step-message-${idx}`}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-muted-foreground text-xs">Delay (hours)</Label>
                      <Input type="number" value={step.delay_hours}
                        onChange={e => updateStep(idx, "delay_hours", parseInt(e.target.value) || 0)}
                        min="0" className="bg-card border-border text-foreground mt-1"
                        data-testid={`step-delay-${idx}`}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-muted-foreground text-xs">A/B Variant</Label>
                      <Select value={step.variant} onValueChange={v => updateStep(idx, "variant", v)}>
                        <SelectTrigger className="bg-card border-border text-foreground mt-1" data-testid={`step-variant-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="A">Variant A</SelectItem>
                          <SelectItem value="B">Variant B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className={colors.ui.primary} data-testid="save-campaign-btn">
              {saving ? "Saving..." : isEdit ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
