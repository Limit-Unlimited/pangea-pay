"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email:       "",
    password:    "",
    confirm:     "",
    phoneNumber: "",
    tcAccepted:  false,
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function f(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.tcAccepted) {
      setError("You must agree to the Terms and Conditions to continue.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:       form.email,
        password:    form.password,
        phoneNumber: form.phoneNumber || undefined,
        tcVersion:   "1.0",
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <Card className="p-8 shadow-sm border-[#E2E8F0] bg-white">
      <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Create account</h1>
      <p className="text-sm text-[#64748B] mb-6">Join Pangea Pay and start sending money globally</p>

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => f("email", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+44 7700 900123"
            value={form.phoneNumber}
            onChange={(e) => f("phoneNumber", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Minimum 12 characters"
            value={form.password}
            onChange={(e) => f("password", e.target.value)}
          />
          <p className="text-xs text-[#64748B]">Minimum 12 characters, including uppercase, lowercase, number, and symbol.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password <span className="text-red-500">*</span></Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            value={form.confirm}
            onChange={(e) => f("confirm", e.target.value)}
          />
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="tc"
            checked={form.tcAccepted}
            onChange={(e) => f("tcAccepted", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] accent-[#4A8C1C] shrink-0"
          />
          <label htmlFor="tc" className="text-sm font-normal text-[#64748B] leading-snug cursor-pointer">
            I agree to the{" "}
            <a href="#" className="text-[#4A8C1C] hover:underline">Terms and Conditions</a>
            {" "}and{" "}
            <a href="#" className="text-[#4A8C1C] hover:underline">Privacy Policy</a>
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-center text-[#64748B] mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#4A8C1C] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
