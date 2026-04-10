"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]     = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      refs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the 6-digit code."); return; }

    setLoading(true);
    setError("");

    const res  = await fetch("/api/verify-email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, otp: code }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Verification failed. Please try again.");
      return;
    }

    router.push("/login?verified=1");
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    // Trigger resend by calling the register endpoint with just the email
    // The API resends the OTP for unverified accounts
    await fetch("/api/resend-verification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    }).catch(() => null);
    setResending(false);
    setResent(true);
  }

  return (
    <Card className="p-8 shadow-sm border-[#E2E8F0] bg-white">
      <h1 className="text-2xl font-bold text-[#1A2332] mb-1">Verify your email</h1>
      <p className="text-sm text-[#64748B] mb-6">
        We sent a 6-digit code to <strong>{email || "your email"}</strong>. Enter it below to continue.
      </p>

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </Alert>
      )}
      {resent && (
        <Alert className="mb-4 text-sm text-green-700 bg-green-50 border-green-200">
          A new code has been sent.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-[#CBD5E1] bg-white outline-none focus:border-[#1E4D8C] focus:ring-2 focus:ring-[#1E4D8C]/20 transition-colors"
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={loading || otp.join("").length !== 6}
          className="w-full h-10 bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
        >
          {loading ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <p className="text-sm text-center text-[#64748B] mt-6">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[#1E4D8C] hover:underline font-medium disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </Card>
  );
}
