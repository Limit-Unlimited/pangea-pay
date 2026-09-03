"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Building2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type AccountType = "individual" | "business";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]             = useState<0 | 1>(0);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [form, setForm] = useState({
    email:       "",
    password:    "",
    confirm:     "",
    phoneNumber: "",
    tcAccepted:  false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function f(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function selectType(type: AccountType) {
    setAccountType(type);
    setStep(1);
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

    sessionStorage.setItem("pendingAccountType", accountType);
    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
  }

  // ── Step 0: Account type selection ──────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1A2332]">Open an account</h1>
          <p className="text-sm text-[#64748B] mt-1">What type of account do you need?</p>
        </div>

        <div className="grid gap-4">
          {([
            {
              type: "individual" as AccountType,
              icon: <User className="h-6 w-6 text-[#4A8C1C]" />,
              title: "Personal account",
              description: "For individuals sending money internationally — to family, friends, or for personal payments abroad.",
              tags: ["ID verification", "4 steps", "~5 minutes"],
            },
            {
              type: "business" as AccountType,
              icon: <Building2 className="h-6 w-6 text-[#4A8C1C]" />,
              title: "Business account",
              description: "For companies, partnerships, and sole traders. Cross-border payments, supplier payments, and FX conversions.",
              tags: ["Company verification", "5 steps", "~10 minutes"],
            },
          ] as const).map((opt) => (
            <button key={opt.type} onClick={() => selectType(opt.type)} className="group text-left w-full">
              <Card className="p-6 border-gray-200 bg-white hover:border-[#4A8C1C] hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#B0D980]/40 transition-colors">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-[#1A2332]">{opt.title}</h2>
                      <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#4A8C1C] shrink-0 transition-colors" />
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">{opt.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {opt.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-[#4A8C1C] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>

        <p className="text-sm text-center text-[#64748B] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#4A8C1C] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    );
  }

  // ── Step 1: Registration form ────────────────────────────────────────────────
  return (
    <Card className="p-8 shadow-sm border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => { setStep(0); setError(""); }}
        className="text-sm text-[#64748B] hover:text-[#4A8C1C] transition-colors mb-4 flex items-center gap-1"
      >
        ← Change account type
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-[#1A2332]">Create account</h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-[#4A8C1C] font-medium capitalize">
          {accountType === "business" ? "Business" : "Personal"}
        </span>
      </div>
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Minimum 12 characters"
              value={form.password}
              onChange={(e) => f("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A2332]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-[#64748B]">Minimum 12 characters, including uppercase, lowercase, number, and symbol.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Re-enter your password"
              value={form.confirm}
              onChange={(e) => f("confirm", e.target.value)}
            />
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
