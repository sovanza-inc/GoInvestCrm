import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { colors, getStatusColor, getScoreColor, getScoreLabel, getPlatformColor } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Sparkles, Trash2, Upload, Download, Edit, X } from "lucide-react";
import { toast } from "sonner";

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
  
  // Bulk actions state
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({ status: "", tags: "" });

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

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk import
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      
      const res = await api.post("/leads/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success(`Import complete! Imported: ${res.data.imported}, Skipped: ${res.data.skipped}`);
      if (res.data.errors.length > 0) {
        console.log("Import errors:", res.data.errors);
      }
      
      setShowImport(false);
      setImportFile(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // Bulk export
  const handleExport = async () => {
    try {
      const response = await api.post("/leads/bulk-export", {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Leads exported successfully");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  // Bulk update
  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    const updates = {};
    if (bulkUpdateData.status) updates.status = bulkUpdateData.status;
    if (bulkUpdateData.tags) updates.tags = bulkUpdateData.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (Object.keys(updates).length === 0) {
      toast.error("No updates specified");
      return;
    }

    try {
      const res = await api.post("/leads/bulk-update", {
        lead_ids: selectedLeads,
        updates
      });
      
      toast.success(res.data.message);
      setShowBulkUpdate(false);
      setBulkUpdateData({ status: "", tags: "" });
      setSelectedLeads([]);
      fetchLeads();
    } catch (err) {
      toast.error("Bulk update failed");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    try {
      const res = await api.post("/leads/bulk-delete", {
        lead_ids: selectedLeads
      });
      
      toast.success(res.data.message);
      setShowBulkDelete(false);
      setSelectedLeads([]);
      fetchLeads();
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total leads {selectedLeads.length > 0 && `• ${selectedLeads.length} selected`}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline"
            className="border-border text-foreground hover:bg-accent">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={handleExport} variant="outline"
            className="border-border text-foreground hover:bg-accent">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={() => setShowAdd(true)} data-testid="add-lead-btn"
            className={colors.ui.primary}>
            <Plus className="w-4 h-4 mr-2" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedLeads.length > 0 && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-primary font-medium">{selectedLeads.length} leads selected</span>
              <Button size="sm" variant="ghost" onClick={() => setSelectedLeads([])}
                className="text-muted-foreground hover:text-foreground h-7">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowBulkUpdate(true)}
                className={colors.ui.warning + " h-8"}>
                <Edit className="w-3 h-3 mr-1" /> Update
              </Button>
              <Button size="sm" onClick={() => setShowBulkDelete(true)}
                className={colors.ui.danger + " h-8"}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search leads..." data-testid="leads-search-input"
              className="pl-9 bg-input border-border h-10 text-foreground placeholder:text-slate-600"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="leads-status-filter">
            <SelectTrigger className="w-40 bg-input border-border text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-border">
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
            <SelectTrigger className="w-40 bg-input border-border text-foreground"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-border">
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
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-testid="leads-table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-slate-600"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Lead</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Platform</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Score</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Tags</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Followers</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`} className="border-border/50 hover:bg-slate-800/30">
                  <TableCell>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelectLead(lead.id)}
                      className="border-slate-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={lead.avatar} alt={lead.name} className="w-8 h-8 rounded-full bg-muted" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">@{lead.handle}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${getPlatformColor(lead.platform)}`}>{lead.platform}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                      <span className={`text-[10px] ${getScoreColor(lead.score)}`}>{getScoreLabel(lead.score)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.slice(0, 2).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-border">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{lead.followers?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80"
                        onClick={() => aiScore(lead.id)} disabled={scoring === lead.id}
                        data-testid={`ai-score-btn-${lead.id}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80"
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
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">Add New Lead</DialogTitle></DialogHeader>
          <form onSubmit={addLead} className="space-y-4" data-testid="add-lead-form">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Name</Label>
                <Input data-testid="lead-name-input" className="bg-input border-border text-foreground" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} required /></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Handle</Label>
                <Input data-testid="lead-handle-input" className="bg-input border-border text-foreground" value={newLead.handle} onChange={e => setNewLead({...newLead, handle: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Platform</Label>
                <Select value={newLead.platform} onValueChange={v => setNewLead({...newLead, platform: v})}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-border">
                    <SelectItem value="instagram">Instagram</SelectItem><SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Followers</Label>
                <Input type="number" className="bg-input border-border text-foreground" value={newLead.followers} onChange={e => setNewLead({...newLead, followers: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Engagement Rate (%)</Label>
              <Input type="number" step="0.1" className="bg-input border-border text-foreground" value={newLead.engagement_rate} onChange={e => setNewLead({...newLead, engagement_rate: parseFloat(e.target.value) || 0})} /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Bio</Label>
              <Textarea className="bg-input border-border text-foreground h-16" value={newLead.bio} onChange={e => setNewLead({...newLead, bio: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground text-xs">Tags (comma separated)</Label>
              <Input className="bg-input border-border text-foreground" value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} placeholder="interested, high-value" /></div>
            <Button type="submit" data-testid="submit-lead-btn" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Add Lead</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import Leads from CSV</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Upload a CSV file with columns: name, handle, platform, bio, followers, engagement_rate, tags, notes, status
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">CSV File</Label>
              <Input 
                type="file" 
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="bg-input border-border text-foreground cursor-pointer"
                required
              />
              <p className="text-xs text-muted-foreground">Duplicates will be skipped automatically</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowImport(false)}
                className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" disabled={importing}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                {importing ? "Importing..." : "Import Leads"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update {selectedLeads.length} Leads</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Changes will be applied to all selected leads
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Update Status</Label>
              <Select value={bulkUpdateData.status} onValueChange={v => setBulkUpdateData({...bulkUpdateData, status: v})}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-border">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Add Tags (comma separated)</Label>
              <Input 
                className="bg-input border-border text-foreground"
                placeholder="bulk-2024, campaign-q1"
                value={bulkUpdateData.tags}
                onChange={e => setBulkUpdateData({...bulkUpdateData, tags: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">These tags will be added to existing tags</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBulkUpdate(false)}
                className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white">
                Update Leads
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete {selectedLeads.length} Leads?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This action cannot be undone. All selected leads will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowBulkDelete(false)}
              className="flex-1 border-border text-foreground">Cancel</Button>
            <Button onClick={handleBulkDelete}
              className="flex-1 bg-red-600 hover:bg-red-500 text-foreground">
              Delete Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
