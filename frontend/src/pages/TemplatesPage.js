import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Copy, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS = { cold_outreach: "Cold Outreach", follow_up: "Follow Up", objection_handling: "Objections", closing: "Closing", post_sale: "Post Sale", discovery: "Discovery", general: "General" };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", content: "", category: "general", tags: "" });

  const fetchTemplates = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter !== "all") params.category = catFilter;
      const res = await api.get("/templates", { params });
      setTemplates(res.data.templates);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTemplates(); }, [search, catFilter]);

  const openEditor = (t = null) => {
    if (t) {
      setEditing(t);
      setForm({ name: t.name, content: t.content, category: t.category, tags: t.tags?.join(", ") || "" });
    } else {
      setEditing(null);
      setForm({ name: "", content: "", category: "general", tags: "" });
    }
    setShowEditor(true);
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] };
    try {
      if (editing) {
        await api.put(`/templates/${editing.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post("/templates", payload);
        toast.success("Template created");
      }
      setShowEditor(false);
      fetchTemplates();
    } catch { toast.error("Failed to save template"); }
  };

  const deleteTemplate = async (id) => {
    try { await api.delete(`/templates/${id}`); toast.success("Template deleted"); fetchTemplates(); }
    catch { toast.error("Failed to delete"); }
  };

  const copyTemplate = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Templates</h1>
          <p className="text-sm text-slate-400 mt-1">Message templates for every sales scenario</p>
        </div>
        <Button onClick={() => openEditor()} data-testid="create-template-btn"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search templates..." data-testid="templates-search-input"
            className="pl-9 bg-slate-950/50 border-slate-700 h-10 text-slate-200 placeholder:text-slate-600"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48 bg-slate-950/50 border-slate-700 text-slate-300" data-testid="templates-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
            <SelectItem value="follow_up">Follow Up</SelectItem>
            <SelectItem value="objection_handling">Objections</SelectItem>
            <SelectItem value="closing">Closing</SelectItem>
            <SelectItem value="discovery">Discovery</SelectItem>
            <SelectItem value="post_sale">Post Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="templates-grid">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No templates found</p>
          </div>
        ) : templates.map((t) => (
          <Card key={t.id} data-testid={`template-card-${t.id}`}
            className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{t.name}</h3>
                  <Badge variant="outline" className="text-[10px] mt-1 text-slate-400 border-slate-700">
                    {CATEGORY_LABELS[t.category] || t.category}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0 ml-2">Used {t.usage_count}x</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 mb-3">{t.content}</p>
              {t.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {t.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] text-slate-500 border-slate-700/50">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300"
                  onClick={() => copyTemplate(t.content)} data-testid={`copy-template-${t.id}`}>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400 hover:text-slate-300"
                  onClick={() => openEditor(t)} data-testid={`edit-template-${t.id}`}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300"
                  onClick={() => deleteTemplate(t.id)} data-testid={`delete-template-${t.id}`}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <form onSubmit={saveTemplate} className="space-y-4" data-testid="template-editor-form">
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Name</Label>
              <Input data-testid="template-name-input" className="bg-slate-950/50 border-slate-700 text-slate-200"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="objection_handling">Objections</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="discovery">Discovery</SelectItem>
                  <SelectItem value="post_sale">Post Sale</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Message Content</Label>
              <Textarea data-testid="template-content-input" rows={5}
                className="bg-slate-950/50 border-slate-700 text-slate-200"
                value={form.content} onChange={e => setForm({...form, content: e.target.value})} required
                placeholder="Use {name}, {topic}, {plan} as placeholders..." /></div>
            <div className="space-y-1.5"><Label className="text-slate-400 text-xs">Tags (comma separated)</Label>
              <Input className="bg-slate-950/50 border-slate-700 text-slate-200"
                value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="cold, opening" /></div>
            <Button type="submit" data-testid="save-template-btn"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
