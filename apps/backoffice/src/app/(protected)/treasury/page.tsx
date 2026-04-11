"use client";

import { useState, useEffect } from "react";
import { Landmark, Plus, Loader2, ChevronDown, ChevronRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type NostroAccount = {
  id: string; accountRef: string; bankName: string; bankCountry: string;
  currency: string; bookBalance: string; isSafeguarded: "yes" | "no";
  status: string; notes: string | null;
};

type NostroEntry = {
  id: string; valueDate: string; direction: "credit" | "debit";
  amount: string; currency: string; runningBalance: string;
  description: string | null; entryRef: string | null; isReconciled: "yes" | "no";
};

type PrefundRecord = {
  id: string; prefundRef: string; amount: string; currency: string;
  valueDate: string; status: string; notes: string | null;
  bankName: string | null; accountRef: string | null;
};

function initNostroForm() {
  return { bankName: "", bankCountry: "GB", currency: "GBP", accountNumber: "", iban: "", swiftBic: "", sortCode: "", isSafeguarded: "no" as "yes" | "no", notes: "" };
}
function initEntryForm() {
  return { valueDate: "", direction: "credit" as "credit" | "debit", amount: "", currency: "", description: "", entryRef: "" };
}
function initPrefundForm() {
  return { nostroAccountId: "", amount: "", currency: "GBP", valueDate: "", notes: "" };
}

export default function TreasuryPage() {
  const [accounts, setAccounts]   = useState<NostroAccount[]>([]);
  const [prefunds, setPrefunds]   = useState<PrefundRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refresh, setRefresh]     = useState(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entries, setEntries]       = useState<NostroEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [showNostro, setShowNostro]   = useState(false);
  const [nostroForm, setNostroForm]   = useState(initNostroForm());
  const [savingNostro, setSavingNostro] = useState(false);
  const [nostroError, setNostroError] = useState("");

  const [showEntry, setShowEntry]     = useState<string | null>(null); // nostroAccountId
  const [entryForm, setEntryForm]     = useState(initEntryForm());
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError]   = useState("");

  const [showPrefund, setShowPrefund] = useState(false);
  const [prefundForm, setPrefundForm] = useState(initPrefundForm());
  const [savingPrefund, setSavingPrefund] = useState(false);
  const [prefundError, setPrefundError]   = useState("");

  function load() { setLoading(true); setRefresh((n) => n + 1); }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/treasury/nostro").then((r) => r.json()),
      fetch("/api/treasury/prefunding").then((r) => r.json()),
    ]).then(([accs, pfs]) => {
      if (!cancelled) {
        setAccounts(accs ?? []);
        setPrefunds(pfs ?? []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  async function loadEntries(accountId: string) {
    setLoadingEntries(true);
    const res = await fetch(`/api/treasury/nostro/${accountId}/entries`);
    const d = await res.json();
    setEntries(d.entries ?? []);
    setLoadingEntries(false);
  }

  function toggleExpand(accountId: string) {
    if (expandedId === accountId) {
      setExpandedId(null);
    } else {
      setExpandedId(accountId);
      loadEntries(accountId);
    }
  }

  async function handleAddNostro(e: React.FormEvent) {
    e.preventDefault();
    setSavingNostro(true);
    setNostroError("");
    const res = await fetch("/api/treasury/nostro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName:      nostroForm.bankName,
        bankCountry:   nostroForm.bankCountry,
        currency:      nostroForm.currency,
        accountNumber: nostroForm.accountNumber || undefined,
        iban:          nostroForm.iban || undefined,
        swiftBic:      nostroForm.swiftBic || undefined,
        sortCode:      nostroForm.sortCode || undefined,
        isSafeguarded: nostroForm.isSafeguarded,
        notes:         nostroForm.notes || undefined,
      }),
    });
    const json = await res.json();
    setSavingNostro(false);
    if (!res.ok) { setNostroError(json.error ?? "Failed to add account"); return; }
    setShowNostro(false);
    setNostroForm(initNostroForm());
    load();
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!showEntry) return;
    setSavingEntry(true);
    setEntryError("");
    const res = await fetch(`/api/treasury/nostro/${showEntry}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valueDate:   entryForm.valueDate,
        direction:   entryForm.direction,
        amount:      entryForm.amount,
        currency:    entryForm.currency,
        description: entryForm.description || undefined,
        entryRef:    entryForm.entryRef || undefined,
      }),
    });
    const json = await res.json();
    setSavingEntry(false);
    if (!res.ok) { setEntryError(json.error ?? "Failed to add entry"); return; }
    setShowEntry(null);
    setEntryForm(initEntryForm());
    load();
    if (expandedId === showEntry) loadEntries(showEntry);
  }

  async function handleAddPrefund(e: React.FormEvent) {
    e.preventDefault();
    setSavingPrefund(true);
    setPrefundError("");
    const res = await fetch("/api/treasury/prefunding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nostroAccountId: prefundForm.nostroAccountId,
        amount:          prefundForm.amount,
        currency:        prefundForm.currency,
        valueDate:       prefundForm.valueDate,
        notes:           prefundForm.notes || undefined,
      }),
    });
    const json = await res.json();
    setSavingPrefund(false);
    if (!res.ok) { setPrefundError(json.error ?? "Failed to record prefunding"); return; }
    setShowPrefund(false);
    setPrefundForm(initPrefundForm());
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;

  const totalSafeguarded = accounts
    .filter((a) => a.isSafeguarded === "yes")
    .reduce((sum, a) => sum + parseFloat(a.bookBalance ?? "0"), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Treasury</h1>
          <p className="text-sm text-[#64748B] mt-1">Nostro accounts, safeguarding, and prefunding.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" onClick={() => { setShowPrefund(true); setPrefundError(""); setPrefundForm(initPrefundForm()); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Prefunding
          </Button>
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white h-9" onClick={() => { setShowNostro(true); setNostroError(""); setNostroForm(initNostroForm()); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Nostro account
          </Button>
        </div>
      </div>

      {/* Safeguarding summary */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Safeguarding summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#64748B]">Safeguarded accounts</p>
            <p className="text-xl font-bold text-[#1A2332]">{accounts.filter((a) => a.isSafeguarded === "yes").length}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Total safeguarded balance</p>
            <p className="text-xl font-bold text-[#1A2332]">
              {totalSafeguarded.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Total nostro accounts</p>
            <p className="text-xl font-bold text-[#1A2332]">{accounts.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Prefunding records</p>
            <p className="text-xl font-bold text-[#1A2332]">{prefunds.length}</p>
          </div>
        </div>
      </Card>

      {/* Nostro accounts */}
      <div>
        <h2 className="text-base font-semibold text-[#1A2332] mb-3">Nostro accounts</h2>
        {accounts.length === 0 ? (
          <Card className="p-8 text-center border-[#E2E8F0]">
            <Landmark className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No nostro accounts yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <Card key={acc.id} className="border-[#E2E8F0] overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F7F9FC] transition-colors"
                  onClick={() => toggleExpand(acc.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Landmark className="w-4 h-4 text-[#64748B] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A2332]">{acc.bankName}</p>
                        <span className="font-mono text-xs text-[#64748B]">{acc.accountRef}</span>
                        {acc.isSafeguarded === "yes" && (
                          <Badge className="text-xs bg-green-100 text-green-800">Safeguarded</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B]">{acc.bankCountry} · {acc.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[#64748B]">Book balance</p>
                      <p className="text-sm font-semibold text-[#1A2332]">
                        {acc.currency} {parseFloat(acc.bookBalance ?? "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowEntry(acc.id); setEntryError(""); setEntryForm({ ...initEntryForm(), currency: acc.currency }); }}
                    >
                      + Entry
                    </Button>
                    {expandedId === acc.id ? <ChevronDown className="w-4 h-4 text-[#64748B]" /> : <ChevronRight className="w-4 h-4 text-[#64748B]" />}
                  </div>
                </div>

                {expandedId === acc.id && (
                  <div className="border-t border-[#E2E8F0] bg-[#F7F9FC] p-4">
                    {loadingEntries ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#64748B]" /></div>
                    ) : entries.length === 0 ? (
                      <p className="text-xs text-[#64748B] text-center py-3">No entries recorded.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[#64748B]">
                            <th className="text-left pb-2 font-semibold">Date</th>
                            <th className="text-left pb-2 font-semibold">Ref</th>
                            <th className="text-left pb-2 font-semibold">Description</th>
                            <th className="text-right pb-2 font-semibold">Debit</th>
                            <th className="text-right pb-2 font-semibold">Credit</th>
                            <th className="text-right pb-2 font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {entries.map((e) => (
                            <tr key={e.id}>
                              <td className="py-1.5">{new Date(e.valueDate).toLocaleDateString("en-GB")}</td>
                              <td className="py-1.5 font-mono">{e.entryRef ?? "—"}</td>
                              <td className="py-1.5 text-[#64748B]">{e.description ?? "—"}</td>
                              <td className="py-1.5 text-right text-red-600">
                                {e.direction === "debit" ? parseFloat(e.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 }) : ""}
                              </td>
                              <td className="py-1.5 text-right text-green-700">
                                {e.direction === "credit" ? parseFloat(e.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 }) : ""}
                              </td>
                              <td className="py-1.5 text-right font-medium">
                                {parseFloat(e.runningBalance).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Prefunding */}
      <div>
        <h2 className="text-base font-semibold text-[#1A2332] mb-3">Prefunding records</h2>
        {prefunds.length === 0 ? (
          <Card className="p-6 text-center border-[#E2E8F0]">
            <p className="text-sm text-[#64748B]">No prefunding records.</p>
          </Card>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Nostro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Value date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {prefunds.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">{p.prefundRef}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#1A2332]">{p.bankName ?? "—"}</p>
                      <p className="text-xs text-[#64748B] font-mono">{p.accountRef}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A2332]">
                      {p.currency} {parseFloat(p.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(p.valueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        p.status === "received" ? "bg-blue-100 text-blue-800" :
                        p.status === "allocated" ? "bg-green-100 text-green-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add nostro dialog */}
      <Dialog open={showNostro} onOpenChange={setShowNostro}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add nostro account</DialogTitle></DialogHeader>
          <form onSubmit={handleAddNostro} className="space-y-4 py-1">
            {nostroError && <p className="text-sm text-red-600">{nostroError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Bank name <span className="text-red-500">*</span></Label>
                <Input required value={nostroForm.bankName} onChange={(e) => setNostroForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Barclays Bank" />
              </div>
              <div className="space-y-1.5">
                <Label>Country <span className="text-red-500">*</span></Label>
                <Input required value={nostroForm.bankCountry} onChange={(e) => setNostroForm((p) => ({ ...p, bankCountry: e.target.value }))} placeholder="GB" maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency <span className="text-red-500">*</span></Label>
                <Input required value={nostroForm.currency} onChange={(e) => setNostroForm((p) => ({ ...p, currency: e.target.value }))} placeholder="GBP" maxLength={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Account number</Label>
                <Input value={nostroForm.accountNumber} onChange={(e) => setNostroForm((p) => ({ ...p, accountNumber: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Sort code</Label>
                <Input value={nostroForm.sortCode} onChange={(e) => setNostroForm((p) => ({ ...p, sortCode: e.target.value }))} className="font-mono text-sm" placeholder="60-16-13" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>IBAN</Label>
                <Input value={nostroForm.iban} onChange={(e) => setNostroForm((p) => ({ ...p, iban: e.target.value }))} className="font-mono text-sm" placeholder="GB29..." />
              </div>
              <div className="space-y-1.5">
                <Label>SWIFT / BIC</Label>
                <Input value={nostroForm.swiftBic} onChange={(e) => setNostroForm((p) => ({ ...p, swiftBic: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Safeguarded?</Label>
                <select value={nostroForm.isSafeguarded} onChange={(e) => setNostroForm((p) => ({ ...p, isSafeguarded: e.target.value as "yes" | "no" }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNostro(false)}>Cancel</Button>
              <Button type="submit" disabled={savingNostro} className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
                {savingNostro ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add entry dialog */}
      <Dialog open={!!showEntry} onOpenChange={() => setShowEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record nostro entry</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEntry} className="space-y-4 py-1">
            {entryError && <p className="text-sm text-red-600">{entryError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Value date <span className="text-red-500">*</span></Label>
                <Input type="date" required value={entryForm.valueDate} onChange={(e) => setEntryForm((p) => ({ ...p, valueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Direction <span className="text-red-500">*</span></Label>
                <select value={entryForm.direction} onChange={(e) => setEntryForm((p) => ({ ...p, direction: e.target.value as "credit" | "debit" }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" required value={entryForm.amount} onChange={(e) => setEntryForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency <span className="text-red-500">*</span></Label>
                <Input required value={entryForm.currency} onChange={(e) => setEntryForm((p) => ({ ...p, currency: e.target.value }))} maxLength={3} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Bank reference</Label>
                <Input value={entryForm.entryRef} onChange={(e) => setEntryForm((p) => ({ ...p, entryRef: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Input value={entryForm.description} onChange={(e) => setEntryForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEntry(null)}>Cancel</Button>
              <Button type="submit" disabled={savingEntry} className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
                {savingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add prefunding dialog */}
      <Dialog open={showPrefund} onOpenChange={setShowPrefund}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record prefunding</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPrefund} className="space-y-4 py-1">
            {prefundError && <p className="text-sm text-red-600">{prefundError}</p>}
            <div className="space-y-1.5">
              <Label>Nostro account <span className="text-red-500">*</span></Label>
              <select required value={prefundForm.nostroAccountId}
                onChange={(e) => setPrefundForm((p) => ({ ...p, nostroAccountId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.bankName} — {a.accountRef} ({a.currency})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" required value={prefundForm.amount} onChange={(e) => setPrefundForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency <span className="text-red-500">*</span></Label>
                <Input required value={prefundForm.currency} onChange={(e) => setPrefundForm((p) => ({ ...p, currency: e.target.value }))} maxLength={3} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Value date <span className="text-red-500">*</span></Label>
                <Input type="date" required value={prefundForm.valueDate} onChange={(e) => setPrefundForm((p) => ({ ...p, valueDate: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPrefund(false)}>Cancel</Button>
              <Button type="submit" disabled={savingPrefund} className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
                {savingPrefund ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record prefunding"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
