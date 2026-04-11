"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const res  = await fetch("/api/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({ email }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error ?? "Something went wrong. Please try again."); return; }
    setSent(true);
  }

  return (
    <Card className="p-8 shadow-sm border-[#E2E8F0] bg-white">
      {sent ? (
        <>
          <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Check your email</h1>
          <p className="text-sm text-[#64748B] mb-6">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
            Check your inbox — it may take a minute to arrive.
          </p>
          <p className="text-sm text-center text-[#64748B] mt-4">
            <Link href="/login" className="text-[#1E4D8C] hover:underline font-medium">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Forgot password</h1>
          <p className="text-sm text-[#64748B] mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" autoComplete="email" required
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <p className="text-sm text-center text-[#64748B] mt-6">
            <Link href="/login" className="text-[#1E4D8C] hover:underline font-medium">Back to sign in</Link>
          </p>
        </>
      )}
    </Card>
  );
}
