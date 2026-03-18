import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, Trash2, Edit2, Shield, Users, Crown, Activity,
  BarChart3, MessageSquare, Target, TrendingUp, Clock
} from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS = {
  admin: "bg-red-600/20 text-red-400 border-red-700",
  manager: "bg-blue-600/20 text-blue-400 border-blue-700",
  agent: "bg-green-600/20 text-green-400 border-green-700"
};

const ROLE_ICONS = { admin: Crown, manager: Shield, agent: Users };

const ACTION_ICONS = {
  lead: Target,
  message: MessageSquare,
  campaign: TrendingUp,
  team: Users,
  default: Activity,
};

export default function TeamPage() {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteData, setInviteData] = useState({ email: "", name: "", role: "agent" });
  const [newRole, setNewRole] = useState("");

  // Activity log
  const [activities, setActivities] = useState([]);
  const [activityFilter, setActivityFilter] = useState("all");
  const [activityLoading, setActivityLoading] = useState(false);

  // Performance
  const [performance, setPerformance] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/team/members");
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const params = { limit: 50 };
      if (activityFilter !== "all") params.entity_type = activityFilter;
      const res = await api.get("/activity/log", { params });
      setActivities(res.data.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  }, [activityFilter]);

  const fetchPerformance = useCallback(async () => {
    setPerfLoading(true);
    try {
      const res = await api.get("/activity/team-performance");
      setPerformance(res.data.members);
    } catch (err) {
      console.error(err);
    } finally {
      setPerfLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (tab === "activity") fetchActivities(); }, [tab, fetchActivities]);
  useEffect(() => { if (tab === "performance") fetchPerformance(); }, [tab, fetchPerformance]);

  const inviteMember = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/team/invite", inviteData);
      toast.success(
        <div>
          <p>Team member invited!</p>
          <p className="text-xs mt-1">Temp password: <strong>{res.data.temp_password}</strong></p>
        </div>,
        { duration: 10000 }
      );
      setShowInvite(false);
      setInviteData({ email: "", name: "", role: "agent" });
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to invite member");
    }
  };

  const updateRole = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/team/members/${selectedMember.id}`, { role: newRole });
      toast.success("Role updated");
      setShowEditRole(false);
      fetchMembers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/team/members/${memberId}`);
      toast.success("Team member removed");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="team-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Team</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} team members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="invite-member-btn">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="members" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-members">
            <Users className="w-4 h-4 mr-1.5" /> Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-activity">
            <Activity className="w-4 h-4 mr-1.5" /> Activity Log
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-performance">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Performance
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6 space-y-4">
          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "admin", icon: Crown, color: "text-red-400", desc: "Full access to all features, team management" },
              { role: "manager", icon: Shield, color: "text-blue-400", desc: "Manage leads, conversations, view analytics" },
              { role: "agent", icon: Users, color: "text-green-400", desc: "Handle assigned leads and conversations" },
            ].map(r => (
              <Card key={r.role} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <r.icon className={`w-5 h-5 ${r.color}`} />
                    <h3 className="font-bold text-foreground capitalize">{r.role}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Members Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Team Members</CardTitle>
              <CardDescription className="text-muted-foreground">Manage your team and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-bold text-xs uppercase">Member</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-xs uppercase">Email</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-xs uppercase">Role</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-xs uppercase">Joined</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : members.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No team members yet</TableCell></TableRow>
                  ) : members.map(member => {
                    const RoleIcon = ROLE_ICONS[member.role] || Users;
                    return (
                      <TableRow key={member.id} className="border-border/50 hover:bg-accent/30" data-testid={`member-row-${member.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={member.avatar} alt="" className="w-8 h-8 rounded-full bg-muted" />
                            <span className="text-sm font-medium text-foreground">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${ROLE_COLORS[member.role] || ''}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />{member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setSelectedMember(member); setNewRole(member.role); setShowEditRole(true); }}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400"
                              onClick={() => removeMember(member.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Activity Log</CardTitle>
                <CardDescription className="text-muted-foreground">Track what's happening across your team</CardDescription>
              </div>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-36 bg-background border-border text-foreground h-8 text-xs" data-testid="activity-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="campaign">Campaigns</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading activities...</p>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No activity logged yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Activity will appear here as your team uses the platform</p>
                </div>
              ) : (
                <div className="space-y-1" data-testid="activity-list">
                  {activities.map(a => {
                    const Icon = ACTION_ICONS[a.entity_type] || ACTION_ICONS.default;
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors" data-testid={`activity-${a.id}`}>
                        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{a.user_name}</span>{" "}
                            <span className="text-muted-foreground">{a.action}</span>
                          </p>
                          {a.details && <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(a.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6">
          <div className="space-y-4">
            {perfLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading performance data...</p>
            ) : performance.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No performance data yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {performance.map(member => (
                  <Card key={member.id} className="bg-card border-border" data-testid={`perf-card-${member.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4 mb-4">
                        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{member.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${ROLE_COLORS[member.role] || ''}`}>{member.role}</Badge>
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: "Leads", value: member.stats.leads_handled, icon: Target, color: "text-blue-400" },
                          { label: "Conversations", value: member.stats.conversations, icon: MessageSquare, color: "text-emerald-400" },
                          { label: "Messages", value: member.stats.messages_sent, icon: MessageSquare, color: "text-amber-400" },
                          { label: "Deals Closed", value: member.stats.deals_closed, icon: TrendingUp, color: "text-violet-400" },
                          { label: "Activities", value: member.stats.activities, icon: Activity, color: "text-pink-400" },
                        ].map((s, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background border border-border text-center">
                            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                            <p className="text-lg font-bold text-foreground">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">Send an invitation to join your team</DialogDescription>
          </DialogHeader>
          <form onSubmit={inviteMember} className="space-y-4" data-testid="invite-form">
            <div>
              <Label className="text-foreground">Email *</Label>
              <Input type="email" value={inviteData.email} onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                className="bg-background border-border text-foreground mt-1" placeholder="member@company.com" required data-testid="invite-email" />
            </div>
            <div>
              <Label className="text-foreground">Name</Label>
              <Input value={inviteData.name} onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                className="bg-background border-border text-foreground mt-1" placeholder="John Doe" data-testid="invite-name" />
            </div>
            <div>
              <Label className="text-foreground">Role</Label>
              <Select value={inviteData.role} onValueChange={v => setInviteData({ ...inviteData, role: v })}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1" data-testid="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="send-invite-btn">Send Invite</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">Change role for {selectedMember?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={updateRole} className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditRole(false)} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">Update Role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
