"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

const schema = z.object({
  name:         z.string().min(1).max(100),
  description:  z.string().max(500).optional(),
  isPrivileged: z.boolean(),
});
type FormData = z.infer<typeof schema>;

type RoleDetail = {
  id: string; name: string; description: string | null;
  isPrivileged: boolean; isSystem: boolean; status: string;
  permissions: { id: string; key: string; name: string; category: string }[];
};
type Permission = { id: string; key: string; name: string; category: string };

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function load() {
    const [roleRes, permsRes] = await Promise.all([
      fetch(`/api/roles/${id}`),
      fetch("/api/permissions"),
    ]);
    if (!roleRes.ok) { router.push("/administration/roles"); return; }
    const roleData: RoleDetail = await roleRes.json();
    const permsData: Permission[] = await permsRes.json();
    setRole(roleData);
    setAllPermissions(Array.isArray(permsData) ? permsData : []);
    setSelectedPermIds(new Set(roleData.permissions.map((p) => p.id)));
    form.reset({ name: roleData.name, description: roleData.description ?? "", isPrivileged: roleData.isPrivileged });
  }

  useEffect(() => { load(); }, [id]);

  function togglePerm(permId: string) {
    if (role?.isSystem) return;
    setSelectedPermIds((prev) => { const next = new Set(prev); next.has(permId) ? next.delete(permId) : next.add(permId); return next; });
  }

  function toggleCategory(cat: string, catPerms: Permission[]) {
    if (role?.isSystem) return;
    const allSelected = catPerms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => { const next = new Set(prev); catPerms.forEach((p) => allSelected ? next.delete(p.id) : next.add(p.id)); return next; });
  }

  async function onSave(data: FormData) {
    setIsSaving(true); setError(null); setSuccess(null);
    const res = await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, permissionIds: [...selectedPermIds] }),
    });
    const json = await res.json().catch(() => ({}));
    setIsSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to save changes."); return; }
    setSuccess("Changes saved."); load();
  }

  if (!role) return <div className="flex items-center justify-center h-48 text-[#64748B]"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>;

  const categories = [...new Set(allPermissions.map((p) => p.category))].sort();
  const readonly = role.isSystem;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/administration/roles")} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#1A2332] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to roles
      </button>

      <PageHeader
        title={role.name}
        action={role.isSystem ? <Badge variant="outline" className="text-[#64748B] border-[#CBD5E1]">System role</Badge> : undefined}
      />

      {readonly && (
        <Alert className="mb-4 border-[#4A8C1C]/20 bg-[#4A8C1C]/5">
          <Info className="h-4 w-4 text-[#4A8C1C]" />
          <AlertDescription className="text-[#4A8C1C]">System roles are managed by the platform and cannot be modified.</AlertDescription>
        </Alert>
      )}

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"} className={`mb-4 ${success ? "border-[#22C55E] text-[#15803D]" : ""}`}>
          {error && <ShieldAlert className="h-4 w-4" />}
          <AlertDescription>{error ?? success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Role name</Label>
              <Input id="name" {...form.register("name")} disabled={readonly} className={readonly ? "bg-[#F8FBEF]" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} rows={2} disabled={readonly} className={readonly ? "bg-[#F8FBEF]" : ""} />
            </div>
            <div className={`flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4 ${readonly ? "opacity-60" : ""}`}>
              <div>
                <p className="font-medium text-[#1A2332]">Privileged role</p>
                <p className="text-sm text-[#64748B]">Privileged role assignments are logged in the audit trail.</p>
              </div>
              <Switch checked={form.watch("isPrivileged")} onCheckedChange={(v) => !readonly && form.setValue("isPrivileged", v)} disabled={readonly} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-[#1A2332]">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((cat) => {
              const catPerms = allPermissions.filter((p) => p.category === cat);
              const allSelected = catPerms.every((p) => selectedPermIds.has(p.id));
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox id={`cat-${cat}`} checked={allSelected} onCheckedChange={() => toggleCategory(cat, catPerms)} disabled={readonly} />
                    <label htmlFor={`cat-${cat}`} className={`text-sm font-semibold text-[#1A2332] capitalize ${readonly ? "" : "cursor-pointer"}`}>
                      {cat.replace(/_/g, " ")}
                    </label>
                  </div>
                  <div className="ml-6 space-y-2">
                    {catPerms.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Checkbox id={perm.id} checked={selectedPermIds.has(perm.id)} onCheckedChange={() => togglePerm(perm.id)} disabled={readonly} />
                        <label htmlFor={perm.id} className={`text-sm text-[#64748B] ${readonly ? "" : "cursor-pointer"}`}>{perm.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {!readonly && (
          <div className="flex gap-3">
            <Button type="submit" className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        )}
      </form>
    </div>
  );
}
