"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldAlert, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  async function onChangePassword(data: PasswordForm) {
    setIsSaving(true); setError(null); setSuccess(null);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    });
    const json = await res.json().catch(() => ({}));
    setIsSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to change password."); return; }
    setSuccess("Password changed successfully.");
    form.reset();
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="My profile" description="Manage your account settings and security." />

      <Tabs defaultValue="account">
        <TabsList className="mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card className="border-[#E2E8F0]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#4A8C1C] text-white text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-[#1A2332]">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-[#64748B]">{user.email}</p>
                </div>
              </div>
              <Separator className="mb-6" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  ["Email",  user.email],
                  ["Status", user.status ?? "—"],
                  ["MFA",    user.mfaEnabled ? "Enabled" : "Not set up"],
                  ["Tenant", user.tenantId ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[#64748B]">{label}</p>
                    <p className="font-medium text-[#1A2332] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Change password */}
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
              <CardDescription>Your password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.</CardDescription>
            </CardHeader>
            <CardContent>
              {(error || success) && (
                <Alert variant={error ? "destructive" : "default"} className={`mb-4 ${success ? "border-[#22C55E] text-[#15803D]" : ""}`}>
                  {error && <ShieldAlert className="h-4 w-4" />}
                  {success && <CheckCircle className="h-4 w-4 text-[#22C55E]" />}
                  <AlertDescription>{error ?? success}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={form.handleSubmit(onChangePassword)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <div className="relative">
                    <Input id="currentPassword" type={showCurrent ? "text" : "password"} {...form.register("currentPassword")} />
                    <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.currentPassword && <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNew ? "text" : "password"} {...form.register("newPassword")} />
                    <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type={showNew ? "text" : "password"} {...form.register("confirmPassword")} />
                  {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" disabled={isSaving}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Change password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* MFA */}
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-base">Two-factor authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account with an authenticator app.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.mfaEnabled ? (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#22C55E]" />
                  <div>
                    <p className="font-medium text-[#1A2332]">MFA is active</p>
                    <p className="text-sm text-[#64748B]">Your account is protected by two-factor authentication.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-[#1A2332]">MFA not set up</p>
                      <p className="text-sm text-[#64748B]">Protect your account with an authenticator app.</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => router.push("/setup-mfa")}>Set up MFA</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
