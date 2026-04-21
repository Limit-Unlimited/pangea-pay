"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Beneficiary = {
  id:            string;
  displayName:   string;
  firstName:     string | null;
  lastName:      string | null;
  bankName:      string | null;
  accountNumber: string | null;
  iban:          string | null;
  sortCode:      string | null;
  swiftBic:      string | null;
  currency:      string;
  country:       string;
  status:        string;
  createdAt:     string;
};

const COUNTRIES: Record<string, string> = {
  GB: "United Kingdom", US: "United States", NG: "Nigeria", GH: "Ghana",
  KE: "Kenya", ZA: "South Africa", IN: "India", PK: "Pakistan",
  PH: "Philippines", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NL: "Netherlands", SN: "Senegal", CI: "Côte d'Ivoire", UG: "Uganda", TZ: "Tanzania",
};

const CURRENCIES = [
  "GBP", "USD", "EUR", "NGN", "GHS", "KES", "ZAR", "INR",
  "PKR", "PHP", "XOF", "UGX", "TZS", "CAD", "AUD",
];

function initForm() {
  return {
    displayName: "", firstName: "", lastName: "", bankName: "",
    accountNumber: "", iban: "", sortCode: "", swiftBic: "",
    currency: "GBP", country: "GB",
  };
}

export default function BeneficiariesPage() {
  const [rows, setRows]           = useState<Beneficiary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refresh, setRefresh]     = useState(0);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState(initForm());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  // Trigger a refresh — set loading synchronously in caller (not inside effect)
  function load() { setLoading(true); setRefresh((n) => n + 1); }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/beneficiaries")
      .then((r) => r.json())
      .then((data: Beneficiary[]) => { if (!cancelled) { setRows(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res  = await fetch("/api/beneficiaries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName:   form.displayName,
        firstName:     form.firstName  || null,
        lastName:      form.lastName   || null,
        bankName:      form.bankName   || null,
        accountNumber: form.accountNumber || null,
        iban:          form.iban       || null,
        sortCode:      form.sortCode   || null,
        swiftBic:      form.swiftBic   || null,
        currency:      form.currency,
        country:       form.country,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add beneficiary"); return; }
    setShowAdd(false);
    setForm(initForm());
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/beneficiaries/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Beneficiaries</h1>
          <p className="text-[#64748B] mt-1 text-sm">Manage the people and accounts you send money to.</p>
        </div>
        <Button
          className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-9"
          onClick={() => { setShowAdd(true); setError(""); setForm(initForm()); }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add beneficiary
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-8 border-[#E2E8F0] bg-white text-center">
          <Building2 className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#1A2332] font-medium mb-1">No beneficiaries yet</p>
          <p className="text-sm text-[#64748B]">Add the bank accounts you send money to and they&apos;ll appear here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <Card key={b.id} className="p-4 border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F8FBEF] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A2332] truncate">{b.displayName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#64748B]">{b.bankName ?? "—"}</span>
                    {(b.iban || b.accountNumber) && (
                      <span className="text-xs text-[#64748B] font-mono">
                        · {b.iban ?? b.accountNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium text-[#1A2332]">{b.currency}</p>
                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Globe className="w-3 h-3" />
                    {COUNTRIES[b.country] ?? b.country}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-[#64748B] hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add beneficiary dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add beneficiary</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-1">
            {error && <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name <span className="text-red-500">*</span></Label>
              <Input id="displayName" required value={form.displayName} onChange={field("displayName")} placeholder="e.g. John Smith — Barclays" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={field("firstName")} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={field("lastName")} placeholder="Smith" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
                <select id="currency" required value={form.currency} onChange={field("currency")}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                <select id="country" required value={form.country} onChange={field("country")}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  {Object.entries(COUNTRIES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankName">Bank name</Label>
              <Input id="bankName" value={form.bankName} onChange={field("bankName")} placeholder="e.g. Barclays" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" value={form.iban} onChange={field("iban")} placeholder="GB29NWBK60161331926819" className="font-mono text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input id="accountNumber" value={form.accountNumber} onChange={field("accountNumber")} placeholder="31926819" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortCode">Sort code</Label>
                <Input id="sortCode" value={form.sortCode} onChange={field("sortCode")} placeholder="60-16-13" className="font-mono text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="swiftBic">SWIFT / BIC</Label>
              <Input id="swiftBic" value={form.swiftBic} onChange={field("swiftBic")} placeholder="NWBKGB2L" className="font-mono text-sm" />
            </div>

            <p className="text-xs text-[#64748B]">Either IBAN or account number is required.</p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add beneficiary"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove beneficiary</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748B] py-2">
            Are you sure you want to remove this beneficiary? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
