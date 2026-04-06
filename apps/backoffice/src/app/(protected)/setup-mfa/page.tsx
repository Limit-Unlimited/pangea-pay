"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert, CheckCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

const schema = z.object({
  token: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Digits only"),
});
type FormData = z.infer<typeof schema>;

export default function SetupMfaPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"setup" | "done">("setup");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/auth/setup-mfa")
      .then((r) => r.json())
      .then((data) => { setQrCode(data.qrCode); setSecret(data.secret); })
      .catch(() => setError("Failed to generate MFA setup. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onSubmit(data: FormData) {
    setIsSaving(true); setError(null);
    const res = await fetch("/api/auth/setup-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.token }),
    });
    const json = await res.json().catch(() => ({}));
    setIsSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to verify code."); return; }
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="max-w-md">
        <Card className="border-[#E2E8F0] text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-[#22C55E] mx-auto" />
            <h2 className="text-lg font-semibold text-[#1A2332]">MFA enabled</h2>
            <p className="text-sm text-[#64748B]">Your account is now protected by two-factor authentication. You'll be asked for your code on each sign-in.</p>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white w-full" onClick={() => router.push("/profile")}>
              Back to profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Set up two-factor authentication" description="Protect your account with an authenticator app." />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#64748B]" /></div>
      ) : (
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1A2332]">Step 1 — Scan this QR code</p>
              <p className="text-sm text-[#64748B]">Open your authenticator app (e.g. Google Authenticator, Authy) and scan the code below.</p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white border border-[#E2E8F0] rounded-lg">
                  <img src={qrCode} alt="MFA QR code" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1A2332]">Can't scan? Enter this code manually</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-[#F7F9FC] border border-[#E2E8F0] rounded px-3 py-2 font-mono break-all">{secret}</code>
                <Button type="button" variant="outline" size="icon" onClick={copySecret} aria-label="Copy secret">
                  {copied ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-[#1A2332]">Step 2 — Enter the 6-digit code</p>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="token">Authentication code</Label>
                  <Input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                    {...form.register("token")}
                  />
                  {form.formState.errors.token && <p className="text-xs text-destructive">{form.formState.errors.token.message}</p>}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" disabled={isSaving}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify and enable"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/profile")}>Cancel</Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
