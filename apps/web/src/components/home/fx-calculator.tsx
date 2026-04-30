"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowRight, ArrowLeftRight } from "lucide-react";

const CURRENCIES = [
  { code: "AUD", name: "Australian dollar",   flag: "🇦🇺" },
  { code: "BRL", name: "Brazilian real",       flag: "🇧🇷" },
  { code: "CAD", name: "Canadian dollar",      flag: "🇨🇦" },
  { code: "CHF", name: "Swiss franc",          flag: "🇨🇭" },
  { code: "CNY", name: "Chinese yuan",         flag: "🇨🇳" },
  { code: "CZK", name: "Czech koruna",         flag: "🇨🇿" },
  { code: "DKK", name: "Danish krone",         flag: "🇩🇰" },
  { code: "EUR", name: "Euro",                 flag: "🇪🇺" },
  { code: "GBP", name: "British pound",        flag: "🇬🇧" },
  { code: "HKD", name: "Hong Kong dollar",     flag: "🇭🇰" },
  { code: "HUF", name: "Hungarian forint",     flag: "🇭🇺" },
  { code: "IDR", name: "Indonesian rupiah",    flag: "🇮🇩" },
  { code: "ILS", name: "Israeli shekel",       flag: "🇮🇱" },
  { code: "INR", name: "Indian rupee",         flag: "🇮🇳" },
  { code: "ISK", name: "Icelandic króna",      flag: "🇮🇸" },
  { code: "JPY", name: "Japanese yen",         flag: "🇯🇵" },
  { code: "KRW", name: "South Korean won",     flag: "🇰🇷" },
  { code: "MXN", name: "Mexican peso",         flag: "🇲🇽" },
  { code: "MYR", name: "Malaysian ringgit",    flag: "🇲🇾" },
  { code: "NOK", name: "Norwegian krone",      flag: "🇳🇴" },
  { code: "NZD", name: "New Zealand dollar",   flag: "🇳🇿" },
  { code: "PHP", name: "Philippine peso",      flag: "🇵🇭" },
  { code: "PLN", name: "Polish złoty",         flag: "🇵🇱" },
  { code: "RON", name: "Romanian leu",         flag: "🇷🇴" },
  { code: "SEK", name: "Swedish krona",        flag: "🇸🇪" },
  { code: "SGD", name: "Singapore dollar",     flag: "🇸🇬" },
  { code: "THB", name: "Thai baht",            flag: "🇹🇭" },
  { code: "TRY", name: "Turkish lira",         flag: "🇹🇷" },
  { code: "USD", name: "US dollar",            flag: "🇺🇸" },
  { code: "ZAR", name: "South African rand",   flag: "🇿🇦" },
];

interface Quote {
  from: string; to: string; rate: number;
  sendAmount: number; fee: number; receiveAmount: number; rateDate: string;
}

interface Props {
  initialFrom:    string;
  initialTo:      string;
  initialQuote:   Quote | null;
}

const INITIAL_AMOUNT = 1000;

function fmt(n: number, dp = 2) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function FxCalculator({ initialFrom, initialTo, initialQuote }: Props) {
  const [from,    setFrom]    = useState(initialFrom);
  const [to,      setTo]      = useState(initialTo);
  const [amount,  setAmount]  = useState(String(INITIAL_AMOUNT));
  const [quote,   setQuote]   = useState<Quote | null>(initialQuote);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuote = useCallback(async (f: string, t: string, a: number) => {
    if (f === t || isNaN(a) || a <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/fx/indicative?from=${f}&to=${t}&amount=${a}`);
      const json = await res.json();
      if (res.ok) setQuote(json);
      else { setError(json.error ?? "Rate unavailable"); setQuote(null); }
    } catch {
      setError("Could not fetch rate. Please try again.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const a = parseFloat(amount.replace(/,/g, ""));
    timerRef.current = setTimeout(() => fetchQuote(from, to, a), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [from, to, amount, fetchQuote]);

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  const fromMeta = CURRENCIES.find((c) => c.code === from);
  const toMeta   = CURRENCIES.find((c) => c.code === to);
  const numAmt   = parseFloat(amount.replace(/,/g, "")) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      {/* You send */}
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">You send</p>
      <div className="flex gap-2 mb-1">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base select-none pointer-events-none">
            {fromMeta?.flag}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="pl-9 text-lg font-semibold text-[#1A2332] border-[#D1E8B8] focus-visible:border-[#4A8C1C]"
          />
        </div>
        <Select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-24 font-semibold text-[#1A2332] border-[#D1E8B8] focus-visible:border-[#4A8C1C]"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </Select>
      </div>

      {/* Rate row */}
      <div className="flex items-center justify-between py-3 px-1 min-h-[2.5rem]">
        <div className="text-sm text-[#64748B] flex items-center gap-2 flex-wrap">
          {loading ? (
            <span className="animate-pulse text-xs">Fetching rate…</span>
          ) : quote ? (
            <>
              <span className="text-[#4A8C1C] font-medium">
                1 {from} = {fmt(quote.rate, 4)} {to}
              </span>
              <span className="text-[#D1E8B8]">·</span>
              <span>
                Fee: {fmt(quote.fee)} {from}
                {numAmt > 0 ? ` (${((quote.fee / numAmt) * 100).toFixed(2)}%)` : ""}
              </span>
            </>
          ) : error ? (
            <span className="text-red-500 text-xs">{error}</span>
          ) : null}
        </div>
        <button
          onClick={handleSwap}
          className="p-1.5 rounded-full hover:bg-[#F0F7E6] text-[#4A8C1C] transition-colors shrink-0"
          title="Swap currencies"
          type="button"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>

      {/* They receive */}
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">They receive</p>
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base select-none pointer-events-none">
            {toMeta?.flag}
          </span>
          <Input
            readOnly
            value={
              loading        ? "…" :
              quote          ? fmt(quote.receiveAmount) :
              "—"
            }
            className="pl-9 text-lg font-semibold text-[#1A2332] bg-[#F8FBEF] cursor-default border-[#D1E8B8]"
          />
        </div>
        <Select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-24 font-semibold text-[#1A2332] border-[#D1E8B8] focus-visible:border-[#4A8C1C]"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </Select>
      </div>

      <Link href="/register">
        <Button className="w-full h-12 text-base font-semibold bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
          Get started — it&apos;s free
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>

      <p className="text-xs text-[#64748B] text-center mt-3">
        Indicative rate · Actual rate confirmed at checkout
      </p>
    </div>
  );
}
