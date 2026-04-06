"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert, ArrowLeft, Lock, Unlock, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";

const editSchema = z.object({
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  jobTitle:   z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  roleId:     z.string().uuid().optional(),
});

type EditForm = z.infer<typeof editSchema>;
type UserDetail = {
  id: string; email: string; firstName: string; lastName: string;
  jobTitle: string | null; department: string | null; mobile: string | null;
  status: string; mfaEnabled: boolean; lastLoginAt: string | null;
  invitedAt: string | null; activatedAt: string | null; createdAt: string;
  roles: { id: string; name: string; isPrivileged: boolean }[];
};
type Role = { id: string; name: string; isPrivileged: boolean };

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  async function loadUser() {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) { router.push("/administration/users"); return; }
    const data: UserDetail = await res.json();
    setUser(data);
    form.reset({
      firstName:  data.firstName,
      lastName:   data.lastName,
      jobTitle:   data.jobTitle ?? "",
      department: data.department ?? "",
      roleId:     data.roles[0]?.id ?? "",
    });
  }

  useEffect(() => {
    loadUser();
    fetch("/api/roles").then((r) => r.json()).then(setRoles).catch(() => {});
  }, [id]);

  async function onSave(data: EditForm) {
    setIsSaving(true); setError(null); setSuccess(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    setIsSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to save changes."); return; }
    setSuccess("Changes saved.");
    loadUser();
  }

  async function changeStatus(newStatus: string) {
    setError(null); setSuccess(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) { setError("Failed to update status."); return; }
    setSuccess(`User status changed to ${newStatus}.`);
    loadUser();
  }

  function fmt(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  }

  if (!user) {
    return <div className="flex items-center justify-center h-48 text-[#64748B]"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/administration/users")} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#1A2332] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        action={<StatusBadge status={user.status} className="text-sm px-3 py-1" />}
      />

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"} className={`mb-4 ${success ? "border-[#22C55E] text-[#15803D]" : ""}`}>
          {error && <ShieldAlert className="h-4 w-4" />}
          <AlertDescription>{error ?? success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="actions">Account actions</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="border-[#E2E8F0]">
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" {...form.register("firstName")} />
                    {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" {...form.register("lastName")} />
                    {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input value={user.email} disabled className="bg-[#F7F9FC]" />
                  <p className="text-xs text-[#64748B]">Email address cannot be changed.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">Job title</Label>
                    <Input id="jobTitle" {...form.register("jobTitle")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" {...form.register("department")} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select defaultValue={user.roles[0]?.id ?? undefined} onValueChange={(v) => form.setValue("roleId", (v as string) ?? undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role…" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}{role.isPrivileged ? " (privileged)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" disabled={isSaving}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-[#E2E8F0]">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  ["Invited",       fmt(user.invitedAt)],
                  ["Activated",     fmt(user.activatedAt)],
                  ["Last login",    fmt(user.lastLoginAt)],
                  ["Account created", fmt(user.createdAt)],
                  ["MFA",           user.mfaEnabled ? "Enabled" : "Not set up"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[#64748B]">{label}</p>
                    <p className="font-medium text-[#1A2332]">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card className="border-[#E2E8F0]">
            <CardContent className="pt-6 space-y-4">
              {user.status === "locked" && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="font-medium text-[#1A2332]">Unlock account</p>
                    <p className="text-sm text-[#64748B]">This account is locked due to too many failed login attempts.</p>
                  </div>
                  <Button variant="outline" onClick={() => changeStatus("active")}>
                    <Unlock className="mr-2 h-4 w-4" /> Unlock
                  </Button>
                </div>
              )}
              {user.status === "active" && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="font-medium text-[#1A2332]">Suspend account</p>
                    <p className="text-sm text-[#64748B]">Prevent this user from signing in. Their data is preserved.</p>
                  </div>
                  <Button variant="outline" className="text-[#F59E0B] border-[#F59E0B] hover:bg-[#F59E0B]/10" onClick={() => changeStatus("suspended")}>
                    <Lock className="mr-2 h-4 w-4" /> Suspend
                  </Button>
                </div>
              )}
              {user.status === "suspended" && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <p className="font-medium text-[#1A2332]">Reactivate account</p>
                    <p className="text-sm text-[#64748B]">Allow this user to sign in again.</p>
                  </div>
                  <Button variant="outline" onClick={() => changeStatus("active")}>
                    <Unlock className="mr-2 h-4 w-4" /> Reactivate
                  </Button>
                </div>
              )}
              {!["deactivated", "archived"].includes(user.status) && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-[#EF4444]/30">
                  <div>
                    <p className="font-medium text-[#1A2332]">Deactivate account</p>
                    <p className="text-sm text-[#64748B]">Permanently revoke access. This cannot be easily undone.</p>
                  </div>
                  <Button variant="outline" className="text-[#EF4444] border-[#EF4444] hover:bg-[#EF4444]/10" onClick={() => changeStatus("deactivated")}>
                    <UserX className="mr-2 h-4 w-4" /> Deactivate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
