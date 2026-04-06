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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

const schema = z.object({
  firstName:  z.string().min(1, "First name is required").max(100),
  lastName:   z.string().min(1, "Last name is required").max(100),
  email:      z.string().email("Enter a valid email address"),
  jobTitle:   z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  roleId:     z.string().min(1, "Please select a role"),
});

type FormData = z.infer<typeof schema>;

type Role = { id: string; name: string; isPrivileged: boolean };

export default function InviteUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/roles").then((r) => r.json()).then(setRoles).catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    setIsLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/administration/users");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Invite user"
        description="Send an invitation email with a temporary password. The user will be required to set a new password on first login."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...form.register("lastName")} />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="off" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Job title <span className="text-[#64748B]">(optional)</span></Label>
                <Input id="jobTitle" {...form.register("jobTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Department <span className="text-[#64748B]">(optional)</span></Label>
                <Input id="department" {...form.register("department")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select onValueChange={(v) => form.setValue("roleId", v as string, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter((r) => r).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}{role.isPrivileged ? " (privileged)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.roleId && (
                <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending invitation…</> : "Send invitation"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
