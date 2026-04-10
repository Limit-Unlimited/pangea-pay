"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  email_not_verified:  "Please verify your email before signing in.",
  account_suspended:   "Your account has been suspended. Please contact support.",
  CredentialsSignin:   "Incorrect email or password.",
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email:    form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(ERROR_MESSAGES[result.error] ?? "Sign in failed. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="p-8 shadow-sm border-[#E2E8F0] bg-white">
      <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Sign in</h1>
      <p className="text-sm text-[#64748B] mb-6">Welcome back to Pangea Pay</p>

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-center text-[#64748B] mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-[#1E4D8C] hover:underline font-medium">
          Create account
        </Link>
      </p>
    </Card>
  );
}
