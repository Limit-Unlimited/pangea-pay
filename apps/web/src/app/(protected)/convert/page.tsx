"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

// Common remittance corridors — shown first
const PRIORITY_CURRENCIES = ["GBP", "USD", "EUR", "NGN", "GHS", "KES", "ZAR", "INR", "PKR", "PHP", "XOF", "UGX", "TZS"];

type FxCurrency = { iso_code: string; name: string; symbol: string };

type Quote = {
  id:            string;
  base:          string;
  quote:         string;
  rate:          number;
  sendAmount:    number;
  fee:           number;
  receiveAmount: number;
  rateDate:      string;
  expiresAt:     string;
  expiresInSeconds: number;
};

type Stage = "input" | "quote" | "confirmed";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ---------------------------------------------------------------------------
// Countdown timer component
// ---------------------------------------------------------------------------
function Countdown({
  expiresAt,
  totalSeconds,
  onExpired,
}: {
  expiresAt: string;
  totalSeconds: number;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const calledRef = useRef(false);

  useEffect(() => {
    calledRef.current = false;
    const tick = () => {
      const secs = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && !calledRef.current) {
        calledRef.current = true;
        onExpired();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const pct    = Math.min(100, (remaining / totalSeconds) * 100);
  const colour = remaining > 10 ? "#B0D980" : remaining > 5 ? "#D4EDAA" : "#EF4444";

  return (
    <div className="flex items-center gap-3">
      {/* Circular progress */}
      <div className="relative w-10 h-10 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={colour}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.25s, stroke 0.5s" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: colour }}
        >
          {remaining}
        </span>
      </div>
      <p className="text-sm text-[#64748B]">Rate valid for <span className="font-medium">{remaining}s</span></p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ConvertPage() {
  const router = useRouter();

  const [currencies, setCurrencies] = useState<FxCurrency[]>([]);
  const [stage, setStage]   = useState<Stage>("input");
  const [from, setFrom]     = useState("GBP");
  const [to, setTo]         = useState("USD");
  const [amount, setAmount] = useState("");
  const [quote, setQuote]   = useState<Quote | null>(null);
  const [loading, setLoading]   = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError]   = useState("");

  // Load currency list once
  useEffect(() => {
    fetch("/api/fx/currencies")
      .then((r) => r.json())
      .then((data: FxCurrency[]) => {
        // Sort: priority currencies first, then alphabetical
        const sorted = [...data].sort((a, b) => {
          const ai = PRIORITY_CURRENCIES.indexOf(a.iso_code);
          const bi = PRIORITY_CURRENCIES.indexOf(b.iso_code);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return  1;
          return a.iso_code.localeCompare(b.iso_code);
        });
        setCurrencies(sorted);
      })
      .catch(() => null);
  }, []);

  const handleExpired = useCallback(() => {
    setQuote(null);
    setStage("input");
    setError("The rate has expired. Enter an amount to get a new quote.");
  }, []);

  async function getQuote() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (from === to)      { setError("Select different currencies."); return; }

    setLoading(true);
    setError("");

    const res  = await fetch("/api/fx/quote", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ from, to, amount: amt }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Unable to get quote. Please try again.");
      return;
    }

    setQuote(json);
    setStage("quote");
  }

  async function acceptQuote() {
    if (!quote) return;
    setAccepting(true);
    setError("");

    const res = await fetch("/api/fx/accept", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ quoteId: quote.id }),
    });
    const json = await res.json();
    setAccepting(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to confirm. Please try again.");
      if (json.error?.includes("expired")) {
        setQuote(null);
        setStage("input");
      }
      return;
    }

    setStage("confirmed");
  }

  // ── Stage: input ──────────────────────────────────────────────────────────
  if (stage === "input" || !quote) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Get a quote</h1>
        <p className="text-[#64748B] text-sm">Enter an amount to see the live exchange rate and fee.</p>

        {error && (
          <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
        )}

        <Card className="p-6 border-[#E2E8F0] bg-white space-y-4">
          <div className="space-y-1.5">
            <Label>You send</Label>
            <div className="flex gap-2">
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-24 shrink-0 h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus:border-ring"
              >
                {currencies.map((c) => (
                  <option key={c.iso_code} value={c.iso_code}>{c.iso_code}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && getQuote()}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <button
              onClick={() => { setFrom(to); setTo(from); }}
              className="mx-3 w-8 h-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F8FBEF] transition-colors"
              title="Swap currencies"
            >
              ⇅
            </button>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <div className="space-y-1.5">
            <Label>Recipient gets</Label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
            >
              {currencies.map((c) => (
                <option key={c.iso_code} value={c.iso_code}>{c.iso_code} — {c.name}</option>
              ))}
            </select>
          </div>

          <Button
            className="w-full h-10 bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            onClick={getQuote}
            disabled={loading || !amount}
          >
            {loading ? "Getting rate…" : "Get quote"}
          </Button>
        </Card>

        <p className="text-xs text-[#64748B] text-center">
          Rates from Frankfurter · sourced from central banks · updated daily
        </p>
      </div>
    );
  }

  // ── Stage: quote ──────────────────────────────────────────────────────────
  if (stage === "quote") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Your quote</h1>

        {error && (
          <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
        )}

        <Card className="p-6 border-[#E2E8F0] bg-white space-y-5">
          {/* Rate validity countdown */}
          <div className="flex items-center justify-between">
            <Countdown
              expiresAt={quote.expiresAt}
              totalSeconds={quote.expiresInSeconds}
              onExpired={handleExpired}
            />
            <button
              onClick={() => { setStage("input"); setError(""); }}
              className="text-sm text-[#64748B] hover:text-[#1A2332] transition-colors"
            >
              Change amount
            </button>
          </div>

          {/* Quote breakdown */}
          <div className="rounded-lg bg-[#F8FBEF] border border-[#E2E8F0] p-4 space-y-3">
            <QuoteLine label="You send"    value={`${quote.base} ${fmt(quote.sendAmount)}`} />
            <QuoteLine label="Fee"         value={`${quote.base} ${fmt(quote.fee)}`} muted />
            <QuoteLine label="Exchange rate" value={`1 ${quote.base} = ${fmt(quote.rate, 4)} ${quote.quote}`} muted />
            <div className="border-t border-[#E2E8F0] pt-3">
              <QuoteLine
                label="Recipient gets"
                value={`${quote.quote} ${fmt(quote.receiveAmount)}`}
                bold
                highlight
              />
            </div>
          </div>

          <p className="text-xs text-[#64748B]">
            Rate date: {quote.rateDate} · Rates from Frankfurter / central banks
          </p>

          <Button
            className="w-full h-11 bg-[#D4EDAA] hover:bg-[#d4971d] text-white font-semibold"
            onClick={acceptQuote}
            disabled={accepting}
          >
            {accepting ? "Confirming…" : "Confirm conversion"}
          </Button>
        </Card>
      </div>
    );
  }

  // ── Stage: confirmed ──────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full bg-[#B0D980]/10 flex items-center justify-center mx-auto">
        <span className="text-3xl">✓</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Quote confirmed</h1>
        <p className="text-[#64748B] mt-2 text-sm">
          Your conversion of{" "}
          <strong>{quote.base} {fmt(quote.sendAmount)}</strong> to{" "}
          <strong>{quote.quote} {fmt(quote.receiveAmount)}</strong> has been confirmed.
        </p>
      </div>

      <Card className="p-5 border-[#E2E8F0] bg-white text-left space-y-3">
        <QuoteLine label="You sent"       value={`${quote.base} ${fmt(quote.sendAmount)}`} />
        <QuoteLine label="Fee"            value={`${quote.base} ${fmt(quote.fee)}`} muted />
        <QuoteLine label="Rate"           value={`1 ${quote.base} = ${fmt(quote.rate, 4)} ${quote.quote}`} muted />
        <div className="border-t border-[#E2E8F0] pt-3">
          <QuoteLine label="Amount received" value={`${quote.quote} ${fmt(quote.receiveAmount)}`} bold highlight />
        </div>
        <div className="border-t border-[#E2E8F0] pt-3">
          <QuoteLine label="Quote reference" value={quote.id.slice(0, 8).toUpperCase()} mono muted />
        </div>
      </Card>

      <p className="text-sm text-[#64748B]">
        Payment submission will be available in a future update.
      </p>

      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => { setStage("input"); setQuote(null); setAmount(""); setError(""); }}
        >
          New conversion
        </Button>
        <Button
          className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
          onClick={() => router.push("/dashboard")}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}

function QuoteLine({
  label, value, muted, bold, highlight, mono,
}: {
  label: string; value: string;
  muted?: boolean; bold?: boolean; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <p className={`text-sm ${muted ? "text-[#64748B]" : "text-[#1A2332]"}`}>{label}</p>
      <p className={`text-sm text-right ${mono ? "font-mono" : ""} ${bold ? "font-bold" : ""} ${highlight ? "text-[#4A8C1C]" : muted ? "text-[#64748B]" : "text-[#1A2332]"}`}>
        {value}
      </p>
    </div>
  );
}
