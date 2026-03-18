import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Edit2, Shield, Users, Crown } from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS = {
  admin: "bg-red-600/20 text-red-400 border-red-700",
  manager: "bg-blue-600/20 text-blue-400 border-blue-700",
  agent: "bg-green-600/20 text-green-400 border-green-700"
};

const ROLE_ICONS = {
  admin: Crown,
  manager: Shield,
  agent: Users
};

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [inviteData, setInviteData] = useState({
    email: "",
    name: "",
    role: "agent"
  });
  
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/team/members");
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

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
      toast.success("Role updated successfully");
      setShowEditRole(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      await api.delete(`/team/members/${memberId}`);
      toast.success("Team member removed");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove member");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Team Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} team members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-foreground">Admin</h3>
            </div>
            <p className="text-xs text-muted-foreground">Full access to all features, can manage team members and settings</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-foreground">Manager</h3>
            </div>
            <p className="text-xs text-muted-foreground">Can manage leads, conversations, and view analytics</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-foreground">Agent</h3>
            </div>
            <p className="text-xs text-muted-foreground">Can manage assigned leads and handle conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Team Members</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your team members and their roles</CardDescription>
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
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
              ) : members.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No team members yet</TableCell></TableRow>
              ) : members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role] || Users;
                return (
                  <TableRow key={member.id} className="border-border/50 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full bg-slate-700" />
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[member.role] || 'text-muted-foreground'}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            setSelectedMember(member);
                            setNewRole(member.role);
                            setShowEditRole(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => removeMember(member.id)}
                        >
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

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={inviteMember} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Email *</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="bg-input border-border text-foreground"
                placeholder="member@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                className="bg-input border-border text-foreground"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Role *</Label>
              <Select value={inviteData.role} onValueChange={(v) => setInviteData({ ...inviteData, role: v })}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-border">
                  <SelectItem value="agent">Agent - Basic access</SelectItem>
                  <SelectItem value="manager">Manager - Enhanced access</SelectItem>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}
                className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update Member Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the role for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateRole} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-border">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditRole(false)}
                className="flex-1 border-border text-foreground">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Update Role
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
