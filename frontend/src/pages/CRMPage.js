import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Star, Send, Sparkles, ArrowLeft, Loader2, Filter, X } from "lucide-react";
import { toast } from "sonner";

const platformColors = { instagram: "text-pink-400 border-pink-500/30", facebook: "text-blue-400 border-blue-500/30", linkedin: "text-sky-400 border-sky-500/30", twitter: "text-cyan-400 border-cyan-500/30" };

function ConversationItem({ conv, isActive, onClick }) {
  return (
    <div onClick={onClick} data-testid={`conversation-item-${conv.id}`}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isActive ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-slate-800/50 border border-transparent"}`}>
      <img src={conv.lead_avatar} alt={conv.lead_name} className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 truncate">{conv.lead_name}</span>
          {conv.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{conv.last_message}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${platformColors[conv.platform] || ""}`}>{conv.platform}</Badge>
        {conv.unread_count > 0 && (
          <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px]">{conv.unread_count}</span>
        )}
      </div>
    </div>
  );
}

function AISuggestions({ suggestions, loading, onUse }) {
  if (loading) return (
    <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400 mx-auto" /><p className="text-xs text-slate-500 mt-2">Generating suggestions...</p></div>
  );
  if (!suggestions?.length) return null;
  return (
    <div className="space-y-2 p-3 bg-slate-950/50 rounded-lg border border-violet-500/10" data-testid="ai-suggestions-panel">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">AI Suggestions</span>
      </div>
      {suggestions.map((s, i) => (
        <div key={i} className="ai-suggestion-card rounded-lg p-3 cursor-pointer" data-testid={`ai-suggestion-${i}`} onClick={() => onUse(s.message)}>
          <div className="flex items-center justify-between mb-1.5">
            <Badge variant="outline" className="text-[9px] text-violet-300 border-violet-500/30">{s.tone}</Badge>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{s.message}</p>
          <p className="text-[10px] text-slate-500 mt-1.5">{s.explanation}</p>
        </div>
      ))}
    </div>
  );
}

export default function CRMPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const msgEndRef = useRef(null);
  
  // Enhanced filters
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("last_message_at");
  const [showFilters, setShowFilters] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const params = {};
      if (searchQ) params.search = searchQ;
      if (filter === "starred") params.starred = true;
      if (platformFilter !== "all") params.platform = platformFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (sortBy) params.sort_by = sortBy;
      const res = await api.get("/conversations", { params });
      setConversations(res.data.conversations);
    } catch (err) { console.error(err); }
  }, [searchQ, filter, platformFilter, statusFilter, sortBy]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setShowMobile(true);
    setAiSuggestions([]);
    try {
      const res = await api.get(`/conversations/${conv.id}`);
      setMessages(res.data.messages);
    } catch { toast.error("Failed to load conversation"); }
  };

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeConv) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${activeConv.id}/messages`, { content: msgInput });
      setMessages(prev => [...prev, res.data]);
      setMsgInput("");
      setAiSuggestions([]);
      fetchConversations();
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  const getAiSuggestions = async () => {
    if (!activeConv) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/suggest-reply", { conversation_id: activeConv.id });
      setAiSuggestions(res.data.suggestions);
    } catch { toast.error("AI suggestions failed"); }
    finally { setAiLoading(false); }
  };

  const toggleStar = async (convId, e) => {
    e.stopPropagation();
    try { await api.put(`/conversations/${convId}/star`); fetchConversations(); }
    catch { toast.error("Failed"); }
  };

  const filteredConvs = filter === "unread" ? conversations.filter(c => c.unread_count > 0) : conversations;

  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="flex h-full gap-4">
        {/* Inbox Panel */}
        <div className={`w-full lg:w-96 flex flex-col ${showMobile && activeConv ? "hidden lg:flex" : "flex"}`}>
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Inbox</h1>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search conversations..." data-testid="crm-search-input"
              className="pl-9 bg-slate-950/50 border-slate-700 h-9 text-sm text-slate-200 placeholder:text-slate-600"
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="flex gap-1 flex-1">
              {["all", "unread", "starred"].map(f => (
                <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm"
                  data-testid={`crm-filter-${f}`}
                  className={`text-xs h-7 ${filter === f ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" : "text-slate-500 hover:text-slate-300"}`}
                  onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-slate-400 hover:text-slate-200">
                  <Filter className="w-3 h-3 mr-1" /> More Filters
                  {(platformFilter !== "all" || statusFilter !== "all") && (
                    <span className="ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-slate-900 border-border p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">Advanced Filters</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-slate-400"
                      onClick={() => {
                        setPlatformFilter("all");
                        setStatusFilter("all");
                        setSortBy("last_message_at");
                      }}
                    >
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Platform</label>
                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="last_message_at">Recent Activity</SelectItem>
                        <SelectItem value="created_at">Date Created</SelectItem>
                        <SelectItem value="lead_name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-500 h-8 text-xs"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2" data-testid="crm-inbox-list">
              {filteredConvs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No conversations</p>
              ) : filteredConvs.map(c => (
                <ConversationItem key={c.id} conv={c} isActive={activeConv?.id === c.id} onClick={() => selectConversation(c)} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col bg-slate-900/30 rounded-xl border border-border/50 overflow-hidden ${!showMobile && !activeConv ? "hidden lg:flex" : showMobile && activeConv ? "flex" : "hidden lg:flex"}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-sm">Select a conversation to start</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-400 h-8 w-8"
                  onClick={() => { setShowMobile(false); setActiveConv(null); }} data-testid="crm-back-btn">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <img src={activeConv.lead_avatar} alt="" className="w-9 h-9 rounded-full bg-slate-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{activeConv.lead_name}</p>
                  <p className="text-xs text-slate-500">@{activeConv.lead_handle} &middot; {activeConv.platform}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  data-testid="toggle-star-btn"
                  onClick={(e) => toggleStar(activeConv.id, e)}>
                  <Star className={`w-4 h-4 ${activeConv.starred ? "text-amber-400 fill-amber-400" : "text-slate-500"}`} />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3" data-testid="messages-list">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 ${m.sender === 'user' ? 'msg-user' : 'msg-lead'}`}>
                        <p className="text-sm text-slate-200 leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEndRef} />
                </div>
              </ScrollArea>

              {/* AI Suggestions */}
              {(aiSuggestions.length > 0 || aiLoading) && (
                <div className="px-4 pb-2">
                  <AISuggestions suggestions={aiSuggestions} loading={aiLoading} onUse={(msg) => setMsgInput(msg)} />
                </div>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="p-3 border-t border-border/50 flex gap-2">
                <Button type="button" variant="ghost" size="icon"
                  className="shrink-0 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-10 w-10"
                  onClick={getAiSuggestions} disabled={aiLoading}
                  data-testid="ai-suggest-btn">
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Input placeholder="Type your message..." data-testid="message-input"
                  className="flex-1 bg-slate-950/50 border-slate-700 h-10 text-slate-200 placeholder:text-slate-600"
                  value={msgInput} onChange={e => setMsgInput(e.target.value)} />
                <Button type="submit" disabled={sending || !msgInput.trim()} data-testid="send-message-btn"
                  className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-4">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
