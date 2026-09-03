"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");

    const res  = await fetch("/api/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({ token, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Reset failed. Please try again."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <Card className="p-8 shadow-sm border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-[#1A2332] mb-2">Invalid link</h1>
        <p className="text-sm text-[#64748B] mb-4">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-sm text-[#4A8C1C] hover:underline font-medium">
          Request a new reset link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 shadow-sm border-gray-200 bg-white">
      {done ? (
        <>
          <h1 className="text-2xl font-bold text-[#1A2332] mb-2">Password updated</h1>
          <p className="text-sm text-[#64748B]">Your password has been reset. Redirecting you to sign in…</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Set new password</h1>
          <p className="text-sm text-[#64748B] mb-6">Choose a strong password for your account.</p>

          {error && (
            <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">
              {error}{" "}
              {error.includes("expired") && (
                <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={12}
                  placeholder="At least 12 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A2332]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-[#64748B]">Min. 12 characters, uppercase, lowercase, number and special character.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? "text" : "password"} required
                  placeholder="Repeat your password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A2332]"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading || !token}
              className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
              {loading ? "Saving…" : "Set new password"}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
