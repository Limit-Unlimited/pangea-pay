"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

type Account = {
  id: string; accountNumber: string; currency: string;
  accountType: string; availableBalance: string; status: string;
};
type Beneficiary = {
  id: string; displayName: string; bankName: string | null;
  accountNumber: string | null; iban: string | null; currency: string; country: string;
};
type Quote = {
  id: string; base: string; quote: string; rate: number;
  sendAmount: number; fee: number; receiveAmount: number;
  rateDate: string; expiresAt: string; expiresInSeconds: number;
};

type Stage = "beneficiary" | "amount" | "quote" | "confirm" | "done";

function fmt(n: string | number, currency?: string | null) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  const formatted = num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${currency} ${formatted}` : formatted;
}

function Countdown({ expiresAt, totalSeconds, onExpired }: { expiresAt: string; totalSeconds: number; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const calledRef = useRef(false);
  useEffect(() => {
    calledRef.current = false;
    const tick = () => {
      const secs = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && !calledRef.current) { calledRef.current = true; onExpired(); }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);
  const colour = remaining > 10 ? "#2A9D8F" : remaining > 5 ? "#E9A820" : "#EF4444";
  const pct    = Math.min(100, (remaining / totalSeconds) * 100);
  return (
    <div className="flex items-center gap-2 text-sm text-[#64748B]">
      <div className="relative w-8 h-8 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={colour} strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.25s, stroke 0.5s" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: colour }}>{remaining}</span>
      </div>
      Rate valid for <span className="font-medium" style={{ color: colour }}>{remaining}s</span>
    </div>
  );
}

function QuoteLine({ label, value, muted, bold, highlight }: { label: string; value: string; muted?: boolean; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <p className={`text-sm ${muted ? "text-[#64748B]" : "text-[#1A2332]"}`}>{label}</p>
      <p className={`text-sm text-right ${bold ? "font-bold" : ""} ${highlight ? "text-[#1E4D8C]" : muted ? "text-[#64748B]" : "text-[#1A2332]"}`}>{value}</p>
    </div>
  );
}

const STEPS = ["Beneficiary", "Amount", "Quote", "Confirm"] as const;

export default function SendPage() {
  const router = useRouter();

  const [stage, setStage]             = useState<Stage>("beneficiary");
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [beneficiaries, setBenefs]    = useState<Beneficiary[]>([]);
  const [selectedBenef, setSelBenef]  = useState<Beneficiary | null>(null);
  const [selectedAccount, setAccount] = useState<Account | null>(null);
  const [amount, setAmount]           = useState("");
  const [quote, setQuote]             = useState<Quote | null>(null);
  const [customerRef, setCustRef]     = useState("");
  const [result, setResult]           = useState<{ referenceNumber: string } | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts).catch(() => null);
    fetch("/api/beneficiaries").then((r) => r.json()).then(setBenefs).catch(() => null);
  }, []);

  const handleExpired = useCallback(() => {
    setQuote(null);
    setStage("amount");
    setError("The rate has expired. Please get a new quote.");
  }, []);

  async function getQuote() {
    if (!selectedAccount || !selectedBenef) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (amt > parseFloat(selectedAccount.availableBalance)) { setError("Insufficient available balance."); return; }

    setLoading(true); setError("");
    const res  = await fetch("/api/fx/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({ from: selectedAccount.currency, to: selectedBenef.currency, amount: amt }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Unable to get quote."); return; }
    setQuote(json);
    setStage("quote");
  }

  async function acceptAndConfirm() {
    if (!quote) return;
    setLoading(true); setError("");

    // Accept the FX quote first
    const acceptRes = await fetch("/api/fx/accept", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({ quoteId: quote.id }),
    });
    if (!acceptRes.ok) {
      const j = await acceptRes.json();
      setLoading(false);
      setError(j.error ?? "Failed to confirm rate.");
      if (j.error?.includes("expired")) { setQuote(null); setStage("amount"); }
      return;
    }

    // Submit payment
    const payRes = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({
        fromAccountId: selectedAccount!.id,
        beneficiaryId: selectedBenef!.id,
        sendAmount:    quote.sendAmount,
        sendCurrency:  selectedAccount!.currency,
        quoteId:       quote.id,
        customerRef:   customerRef || undefined,
      }),
    });
    const payJson = await payRes.json();
    setLoading(false);
    if (!payRes.ok) { setError(payJson.error ?? "Payment failed."); return; }

    setResult(payJson);
    setStage("done");
  }

  const stepIndex = stage === "beneficiary" ? 0 : stage === "amount" ? 1 : stage === "quote" ? 2 : stage === "confirm" || stage === "done" ? 3 : 0;

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === "done" && result) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-8">
        <div className="w-16 h-16 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-[#2A9D8F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Payment submitted</h1>
          <p className="text-[#64748B] mt-2 text-sm">
            Your payment to <strong>{selectedBenef?.displayName}</strong> has been submitted
            and is being processed.
          </p>
        </div>
        <Card className="p-5 border-[#E2E8F0] bg-white text-left space-y-3">
          <QuoteLine label="You sent"        value={fmt(quote!.sendAmount, selectedAccount?.currency)} />
          <QuoteLine label="Fee"             value={fmt(quote!.fee, selectedAccount?.currency)} muted />
          <QuoteLine label="Rate"            value={`1 ${selectedAccount?.currency} = ${quote!.rate.toFixed(4)} ${selectedBenef?.currency}`} muted />
          <div className="border-t border-[#E2E8F0] pt-3">
            <QuoteLine label="Recipient gets" value={fmt(quote!.receiveAmount, selectedBenef?.currency)} bold highlight />
          </div>
          <div className="border-t border-[#E2E8F0] pt-3">
            <QuoteLine label="Reference" value={result.referenceNumber} />
          </div>
        </Card>
        <p className="text-xs text-[#64748B]">
          You can track this payment in your transaction history.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/transactions")}>View history</Button>
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => router.push("/dashboard")}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Send money</h1>
        <p className="text-[#64748B] mt-1 text-sm">Transfer funds to a saved beneficiary.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i < stepIndex ? "bg-[#2A9D8F] text-white" : i === stepIndex ? "bg-[#1E4D8C] text-white" : "bg-[#E2E8F0] text-[#64748B]"}`}>
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${i === stepIndex ? "text-[#1E4D8C]" : "text-[#64748B]"}`}>{step}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 ${i < stepIndex ? "bg-[#2A9D8F]" : "bg-[#E2E8F0]"}`} />
            )}
          </div>
        ))}
      </div>

      {error && <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>}

      {/* ── Step 1: Select beneficiary ─────────────────────────────────── */}
      {stage === "beneficiary" && (
        <Card className="p-6 border-[#E2E8F0] bg-white space-y-4">
          <h2 className="text-sm font-semibold text-[#1A2332]">Who are you sending to?</h2>
          {beneficiaries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#64748B] mb-3">You have no saved beneficiaries.</p>
              <Button variant="outline" size="sm" onClick={() => router.push("/beneficiaries")}>Add a beneficiary</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {beneficiaries.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelBenef(b); setError(""); setStage("amount"); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                    ${selectedBenef?.id === b.id ? "border-[#1E4D8C] bg-[#F0F5FF]" : "border-[#E2E8F0] hover:border-[#1E4D8C]/40 hover:bg-[#F7F9FC]"}`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#64748B]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A2332] truncate">{b.displayName}</p>
                    <p className="text-xs text-[#64748B]">{b.currency} · {b.bankName ?? b.country}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Step 2: Amount + funding account ──────────────────────────── */}
      {stage === "amount" && selectedBenef && (
        <Card className="p-6 border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A2332]">How much are you sending?</h2>
            <button onClick={() => { setStage("beneficiary"); setError(""); }} className="text-xs text-[#64748B] hover:text-[#1A2332]">Change</button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F9FC] border border-[#E2E8F0]">
            <Building2 className="w-4 h-4 text-[#64748B] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#1A2332]">{selectedBenef.displayName}</p>
              <p className="text-xs text-[#64748B]">{selectedBenef.currency} · {selectedBenef.bankName ?? selectedBenef.country}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Pay from</Label>
            <select
              value={selectedAccount?.id ?? ""}
              onChange={(e) => setAccount(accounts.find((a) => a.id === e.target.value) ?? null)}
              className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">Select account…</option>
              {accounts.filter((a) => a.status === "active").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.currency} account — {a.accountNumber} (available: {fmt(a.availableBalance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Amount to send</Label>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-16 h-9 rounded-lg border border-[#E2E8F0] bg-[#F7F9FC] text-sm text-[#64748B] font-medium shrink-0">
                {selectedAccount?.currency ?? "—"}
              </span>
              <Input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && getQuote()}
                className="flex-1"
              />
            </div>
            {selectedAccount && (
              <p className="text-xs text-[#64748B]">Available: {fmt(selectedAccount.availableBalance, selectedAccount.currency)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Your reference <span className="text-[#64748B] text-xs font-normal">(optional)</span></Label>
            <Input placeholder="e.g. Rent July" value={customerRef} onChange={(e) => setCustRef(e.target.value)} />
          </div>

          <Button
            className="w-full h-10 bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
            disabled={loading || !selectedAccount || !amount}
            onClick={getQuote}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get quote"}
          </Button>
        </Card>
      )}

      {/* ── Step 3: Quote ──────────────────────────────────────────────── */}
      {stage === "quote" && quote && selectedBenef && selectedAccount && (
        <Card className="p-6 border-[#E2E8F0] bg-white space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A2332]">Your quote</h2>
            <button onClick={() => { setStage("amount"); setError(""); }} className="text-xs text-[#64748B] hover:text-[#1A2332] flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Change
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Countdown expiresAt={quote.expiresAt} totalSeconds={quote.expiresInSeconds} onExpired={handleExpired} />
          </div>

          <div className="rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] p-4 space-y-3">
            <QuoteLine label="You send"       value={fmt(quote.sendAmount,    selectedAccount.currency)} />
            <QuoteLine label="Fee"            value={fmt(quote.fee,           selectedAccount.currency)} muted />
            <QuoteLine label="Exchange rate"  value={`1 ${selectedAccount.currency} = ${quote.rate.toFixed(4)} ${selectedBenef.currency}`} muted />
            <div className="border-t border-[#E2E8F0] pt-3">
              <QuoteLine label="Recipient gets" value={fmt(quote.receiveAmount, selectedBenef.currency)} bold highlight />
            </div>
          </div>

          <div className="text-xs text-[#64748B]">
            Sending to: <span className="font-medium text-[#1A2332]">{selectedBenef.displayName}</span>
            {selectedBenef.iban ? ` · ${selectedBenef.iban}` : selectedBenef.accountNumber ? ` · ${selectedBenef.accountNumber}` : ""}
          </div>

          <Button
            className="w-full h-11 bg-[#E9A820] hover:bg-[#d4971d] text-white font-semibold"
            onClick={() => { setStage("confirm"); setError(""); }}
          >
            Review and confirm
          </Button>
        </Card>
      )}

      {/* ── Step 4: Confirm ────────────────────────────────────────────── */}
      {stage === "confirm" && quote && selectedBenef && selectedAccount && (
        <Card className="p-6 border-[#E2E8F0] bg-white space-y-5">
          <h2 className="text-sm font-semibold text-[#1A2332]">Confirm your payment</h2>

          <div className="rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] p-4 space-y-3">
            <QuoteLine label="Sending to"     value={selectedBenef.displayName} />
            <QuoteLine label="From account"   value={`${selectedAccount.currency} · ${selectedAccount.accountNumber}`} muted />
            <QuoteLine label="You send"       value={fmt(quote.sendAmount,    selectedAccount.currency)} />
            <QuoteLine label="Fee"            value={fmt(quote.fee,           selectedAccount.currency)} muted />
            <QuoteLine label="Exchange rate"  value={`1 ${selectedAccount.currency} = ${quote.rate.toFixed(4)} ${selectedBenef.currency}`} muted />
            {customerRef && <QuoteLine label="Your reference" value={customerRef} muted />}
            <div className="border-t border-[#E2E8F0] pt-3">
              <QuoteLine label="Recipient gets" value={fmt(quote.receiveAmount, selectedBenef.currency)} bold highlight />
            </div>
          </div>

          <p className="text-xs text-[#64748B]">
            By confirming you authorise Pangea Pay to transfer the amount shown above.
            Transfers cannot be reversed once submitted.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setStage("quote"); setError(""); }}>Back</Button>
            <Button
              className="flex-1 h-10 bg-[#E9A820] hover:bg-[#d4971d] text-white font-semibold"
              disabled={loading}
              onClick={acceptAndConfirm}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm payment"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
