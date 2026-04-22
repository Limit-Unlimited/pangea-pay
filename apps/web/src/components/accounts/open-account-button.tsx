"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Plus, X } from "lucide-react";

type Currency = { code: string; name: string; symbol: string };

export function OpenAccountButton({ currencies }: { currencies: Currency[] }) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [currency, setCurrency] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    if (!currency) { setError("Please select a currency."); return; }
    setLoading(true);
    setError("");

    const res  = await fetch("/api/accounts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currency }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Could not open account. Please try again.");
      return;
    }

    setOpen(false);
    setCurrency("");
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Open account
      </Button>
    );
  }

  return (
    <Card className="p-6 border-[#D1E8B8] bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1A2332]">Open a new account</h2>
        <button
          onClick={() => { setOpen(false); setCurrency(""); setError(""); }}
          className="text-[#64748B] hover:text-[#1A2332] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-[#64748B] mb-4">
        Choose the currency for your new account. Your account will be reviewed and activated shortly.
      </p>

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A2332]">Currency</label>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="">Select a currency…</option>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleOpen}
            disabled={loading || !currency}
            className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
          >
            {loading ? "Opening…" : "Open account"}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setOpen(false); setCurrency(""); setError(""); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
