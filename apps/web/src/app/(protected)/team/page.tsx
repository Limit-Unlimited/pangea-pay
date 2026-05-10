"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, MoreHorizontal, Mail, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

type Member = {
  userId: string;
  email: string;
  role: string;
  status: string;
  isPrimary: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner:     "Owner",
  admin:     "Admin",
  standard:  "Member",
  view_only: "View only",
};

const ROLE_BADGE: Record<string, string> = {
  owner:     "bg-blue-100 text-blue-700",
  admin:     "bg-purple-100 text-purple-700",
  standard:  "bg-gray-100 text-gray-700",
  view_only: "bg-gray-100 text-gray-500",
};

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers]       = useState<Member[]>([]);
  const [invites, setInvites]       = useState<PendingInvite[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [canManage, setCanManage]   = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("standard");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting]       = useState(false);

  // Member action
  const [actionMember, setActionMember] = useState<Member | null>(null);
  const [actionOpen, setActionOpen]     = useState(false);
  const [newRole, setNewRole]           = useState("");
  const [updating, setUpdating]         = useState(false);
  const [updateError, setUpdateError]   = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res  = await fetch("/api/team");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load team");
      setLoading(false);
      return;
    }
    setMembers(json.data.members);
    setInvites(json.data.pendingInvites);
    // Determine if current user can manage (owner or admin)
    const meRes  = await fetch("/api/auth/session");
    const meJson = await meRes.json();
    const myId   = meJson?.user?.id ?? null;
    setCurrentUserId(myId);
    const me = json.data.members.find((m: Member) => m.userId === myId);
    setCanManage(me?.role === "owner" || me?.role === "admin");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function sendInvite() {
    setInviteError("");
    if (!inviteEmail) { setInviteError("Email is required."); return; }
    setInviting(true);
    const res  = await fetch("/api/team", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(json.error ?? "Failed to send invitation."); return; }
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("standard");
    await load();
  }

  async function updateMember(status?: string) {
    if (!actionMember) return;
    setUpdateError("");
    setUpdating(true);
    const body: Record<string, string> = {};
    if (newRole)  body.role   = newRole;
    if (status)   body.status = status;
    const res  = await fetch(`/api/team/${actionMember.userId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    setUpdating(false);
    if (!res.ok) { setUpdateError(json.error ?? "Failed to update member."); return; }
    setActionOpen(false);
    setActionMember(null);
    setNewRole("");
    await load();
    router.refresh();
  }

  if (loading) {
    return <div className="text-sm text-gray-500 py-8 text-center">Loading team…</div>;
  }

  if (error) {
    return (
      <div className="max-w-xl">
        <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Team</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* Members list */}
      <Card className="border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active members</p>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-[#4A8C1C] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{initials(m.email)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[#1A2332] truncate">{m.email}</p>
                  {m.userId === currentUserId && (
                    <span className="text-xs text-[#4A8C1C] font-medium">You</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Joined {fmtDate(m.joinedAt)} · Last login {fmtDate(m.lastLoginAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[m.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
                {canManage && m.userId !== currentUserId && (
                  <button
                    onClick={() => { setActionMember(m); setNewRole(m.role); setUpdateError(""); setActionOpen(true); }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending invitations */}
      {invites.length > 0 && (
        <Card className="border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending invitations</p>
          </div>
          <div className="divide-y divide-gray-100">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2332]">{inv.email}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Expires {fmtDate(inv.expiresAt)}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[inv.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {ROLE_LABELS[inv.role] ?? inv.role}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {inviteError && (
              <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{inviteError}</Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="admin">Admin — full access, can manage team</option>
                <option value="standard">Member — can send payments and manage beneficiaries</option>
                <option value="view_only">View only — read access, cannot initiate transactions</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={sendInvite}
              disabled={inviting}
              className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            >
              {inviting ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member action modal */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage member</DialogTitle>
          </DialogHeader>
          {actionMember && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">{actionMember.email}</p>
              {updateError && (
                <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{updateError}</Alert>
              )}
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="standard">Member</option>
                  <option value="view_only">View only</option>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => updateMember("removed")}
              disabled={updating}
              className="text-red-600 border-red-200 hover:bg-red-50 sm:mr-auto"
            >
              Remove
            </Button>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateMember()}
              disabled={updating || !newRole}
              className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            >
              {updating ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
