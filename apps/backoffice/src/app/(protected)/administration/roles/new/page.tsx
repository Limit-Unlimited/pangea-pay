"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  name:         z.string().min(1, "Role name is required").max(100),
  description:  z.string().max(500).optional(),
  isPrivileged: z.boolean(),
});

type FormData = z.infer<typeof schema>;
type Permission = { id: string; key: string; name: string; category: string };

export default function NewRolePage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { isPrivileged: false } });

  useEffect(() => {
    fetch("/api/permissions").then((r) => r.json()).then((data) => {
      setPermissions(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  function togglePerm(id: string) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCategory(cat: string, catPerms: Permission[]) {
    const allSelected = catPerms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true); setError(null);
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, permissionIds: [...selectedPermIds] }),
    });
    const json = await res.json().catch(() => ({}));
    setIsLoading(false);
    if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
    router.push("/administration/roles");
    router.refresh();
  }

  const categories = [...new Set(permissions.map((p) => p.category))].sort();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Create role" description="Define a new access level and assign permissions." />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Role name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Payments Reviewer" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-[#64748B]">(optional)</span></Label>
              <Textarea id="description" {...form.register("description")} rows={2} placeholder="What is this role for?" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4">
              <div>
                <p className="font-medium text-[#1A2332]">Privileged role</p>
                <p className="text-sm text-[#64748B]">Mark roles that have elevated access. Privileged role assignments require additional audit trail.</p>
              </div>
              <Switch
                checked={form.watch("isPrivileged")}
                onCheckedChange={(v) => form.setValue("isPrivileged", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-[#1A2332]">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((cat) => {
              const catPerms = permissions.filter((p) => p.category === cat);
              const allSelected = catPerms.every((p) => selectedPermIds.has(p.id));
              const someSelected = catPerms.some((p) => selectedPermIds.has(p.id));
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`cat-${cat}`}
                      checked={allSelected}
                      data-state={someSelected && !allSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                      onCheckedChange={() => toggleCategory(cat, catPerms)}
                    />
                    <label htmlFor={`cat-${cat}`} className="text-sm font-semibold text-[#1A2332] capitalize cursor-pointer">
                      {cat.replace(/_/g, " ")}
                    </label>
                  </div>
                  <div className="ml-6 space-y-2">
                    {catPerms.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermIds.has(perm.id)}
                          onCheckedChange={() => togglePerm(perm.id)}
                        />
                        <label htmlFor={perm.id} className="text-sm text-[#64748B] cursor-pointer">{perm.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create role"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
