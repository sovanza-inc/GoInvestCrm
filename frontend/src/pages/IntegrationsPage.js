import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { colors, getPlatformColor } from "@/lib/colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageSquare, Send, Search, Plug, PlugZap, Trash2,
  Phone, Instagram, ArrowLeft, Loader2, Wifi, WifiOff
} from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showConnect, setShowConnect] = useState(null);
  const [connectName, setConnectName] = useState("");

  // Conversation state
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [convSearch, setConvSearch] = useState("");

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get("/integrations");
      setIntegrations(res.data.integrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const isConnected = (platform) => integrations.some(i => i.platform === platform);

  const connectPlatform = async (platform) => {
    try {
      const res = await api.post("/integrations/connect", {
        platform,
        account_name: connectName || `My ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      });
      toast.success(`${platform} connected successfully!`);
      setShowConnect(null);
      setConnectName("");
      fetchIntegrations();

      // Auto-seed demo data
      await api.post(`/integrations/${platform}/seed-demo`);
      toast.success("Demo conversations created");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to connect");
    }
  };

  const disconnectPlatform = async (integrationId) => {
    try {
      await api.delete(`/integrations/${integrationId}`);
      toast.success("Integration disconnected");
      fetchIntegrations();
      if (activeTab !== "overview") setActiveTab("overview");
    } catch (err) {
      toast.error("Failed to disconnect");
    }
  };

  const fetchConversations = async (platform) => {
    try {
      const params = {};
      if (convSearch) params.search = convSearch;
      const res = await api.get(`/integrations/${platform}/conversations`, { params });
      setConversations(res.data.conversations);
    } catch (err) {
      console.error(err);
    }
  };

  const openConversation = async (platform, convId) => {
    try {
      const res = await api.get(`/integrations/${platform}/conversations/${convId}`);
      setSelectedConv(res.data.conversation);
      setMessages(res.data.messages);
    } catch (err) {
      toast.error("Failed to load conversation");
    }
  };

  const sendMessage = async (platform) => {
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);
    try {
      const res = await api.post(`/integrations/${platform}/conversations/${selectedConv.id}/send`, {
        content: newMessage,
      });
      setMessages(prev => [...prev, res.data.sent, res.data.reply]);
      setNewMessage("");
      fetchConversations(platform);
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "overview" && isConnected(activeTab)) {
      fetchConversations(activeTab);
      setSelectedConv(null);
      setMessages([]);
    }
  }, [activeTab, convSearch]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading integrations...</div>;

  const platformConfig = {
    whatsapp: { icon: Phone, label: "WhatsApp", color: "text-green-400", bg: "bg-green-500/10" },
    instagram: { icon: Instagram, label: "Instagram", color: "text-pink-400", bg: "bg-pink-500/10" },
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="integrations-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your messaging platforms and manage conversations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-whatsapp" disabled={!isConnected("whatsapp")}>
            <Phone className="w-4 h-4 mr-1.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="instagram" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-instagram" disabled={!isConnected("instagram")}>
            <Instagram className="w-4 h-4 mr-1.5" /> Instagram
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(platformConfig).map(([platform, config]) => {
              const connected = isConnected(platform);
              const integration = integrations.find(i => i.platform === platform);
              const Icon = config.icon;
              return (
                <Card key={platform} className="bg-card border-border" data-testid={`integration-card-${platform}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{config.label}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {connected ? (
                              <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400">Connected</span></>
                            ) : (
                              <><WifiOff className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Not connected</span></>
                            )}
                          </div>
                        </div>
                      </div>
                      {connected && (
                        <Button variant="ghost" size="icon" onClick={() => disconnectPlatform(integration.id)}
                          className="text-muted-foreground hover:text-red-400"
                          data-testid={`disconnect-${platform}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {connected ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{integration.account_name}</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-background border border-border">
                            <p className="text-lg font-bold text-foreground">{integration.stats?.conversations || 0}</p>
                            <p className="text-xs text-muted-foreground">Chats</p>
                          </div>
                          <div className="p-2 rounded-lg bg-background border border-border">
                            <p className="text-lg font-bold text-foreground">{integration.stats?.messages_sent || 0}</p>
                            <p className="text-xs text-muted-foreground">Sent</p>
                          </div>
                          <div className="p-2 rounded-lg bg-background border border-border">
                            <p className="text-lg font-bold text-foreground">{integration.stats?.messages_received || 0}</p>
                            <p className="text-xs text-muted-foreground">Received</p>
                          </div>
                        </div>
                        <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => setActiveTab(platform)}
                          data-testid={`open-${platform}-inbox`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> Open Inbox
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your {config.label} Business account to manage conversations directly from GoSocial.
                        </p>
                        <Button className={colors.ui.primary + " w-full"} onClick={() => setShowConnect(platform)}
                          data-testid={`connect-${platform}-btn`}
                        >
                          <PlugZap className="w-4 h-4 mr-2" /> Connect {config.label}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Platform Inbox Tabs (WhatsApp & Instagram share same UI) */}
        {["whatsapp", "instagram"].map(platform => (
          <TabsContent key={platform} value={platform} className="mt-6">
            {isConnected(platform) && (
              <PlatformInbox
                platform={platform}
                config={platformConfig[platform]}
                conversations={conversations}
                selectedConv={selectedConv}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sending={sending}
                convSearch={convSearch}
                setConvSearch={setConvSearch}
                onSelectConv={(id) => openConversation(platform, id)}
                onSend={() => sendMessage(platform)}
                onBack={() => setSelectedConv(null)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Connect Dialog */}
      <Dialog open={!!showConnect} onOpenChange={() => setShowConnect(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Connect {showConnect?.charAt(0).toUpperCase()}{showConnect?.slice(1)}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your account details to connect. Demo data will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground">Account Name</label>
              <Input
                value={connectName} onChange={e => setConnectName(e.target.value)}
                placeholder={`My ${showConnect?.charAt(0).toUpperCase()}${showConnect?.slice(1)} Business`}
                className="bg-background border-border text-foreground mt-1"
                data-testid="connect-account-name"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConnect(null)} className="border-border text-foreground">Cancel</Button>
              <Button onClick={() => connectPlatform(showConnect)} className={colors.ui.primary} data-testid="confirm-connect-btn">
                <PlugZap className="w-4 h-4 mr-2" /> Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformInbox({ platform, config, conversations, selectedConv, messages, newMessage, setNewMessage, sending, convSearch, setConvSearch, onSelectConv, onSend, onBack }) {
  const Icon = config.icon;

  if (selectedConv) {
    return (
      <Card className="bg-card border-border" data-testid={`${platform}-chat-view`}>
        <CardContent className="p-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={selectedConv.contact_avatar} alt="" className="w-9 h-9 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{selectedConv.contact_name}</p>
              <p className="text-xs text-muted-foreground">{selectedConv.contact_handle}</p>
            </div>
            <Badge className={`text-xs ${getPlatformColor(platform)}`}>{platform}</Badge>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-3" data-testid={`${platform}-messages`}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-accent text-foreground rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No messages yet. Start a conversation!
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex items-center gap-3">
            <Input
              value={newMessage} onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-background border-border text-foreground flex-1"
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend()}
              data-testid={`${platform}-message-input`}
            />
            <Button onClick={onSend} disabled={sending || !newMessage.trim()} className={colors.ui.primary}
              data-testid={`${platform}-send-btn`}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={convSearch} onChange={e => setConvSearch(e.target.value)}
          placeholder={`Search ${config.label} conversations...`}
          className="bg-card border-border text-foreground pl-10"
          data-testid={`${platform}-search`}
        />
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Icon className={`w-10 h-10 mx-auto ${config.color} mb-3 opacity-40`} />
            <p className="text-muted-foreground text-sm">No conversations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Card key={conv.id} className="bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelectConv(conv.id)}
              data-testid={`conv-${conv.id}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <img src={conv.contact_avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm truncate">{conv.contact_name}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conv.contact_handle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {conv.unread}
                    </span>
                  )}
                  <Badge className={`text-xs ${
                    conv.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                    conv.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    {conv.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
