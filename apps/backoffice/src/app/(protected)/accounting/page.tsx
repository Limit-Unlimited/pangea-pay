"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type CoaAccount = {
  id: string; code: string; name: string; accountType: string;
  subType: string | null; currency: string | null; balance: string;
  isSystem: boolean; isActive: boolean; sortOrder: number;
};

type JournalEntry = {
  id: string; entryRef: string; entryDate: string; description: string;
  entryType: string; status: string; postedAt: string | null;
  transactionId: string | null;
};

type JournalLine = {
  accountId: string; accountCode: string; accountName: string;
  accountType: string; side: "debit" | "credit"; amount: string; currency: string; description: string | null;
};

type JournalDetail = JournalEntry & { lines: JournalLine[] };

const TYPE_COLOURS: Record<string, string> = {
  asset:     "bg-blue-100 text-blue-800",
  liability: "bg-orange-100 text-orange-800",
  equity:    "bg-purple-100 text-purple-800",
  revenue:   "bg-green-100 text-green-800",
  expense:   "bg-red-100 text-red-800",
};

const STATUS_COLOURS: Record<string, string> = {
  draft:    "bg-slate-100 text-slate-700",
  posted:   "bg-green-100 text-green-800",
  reversed: "bg-red-100 text-red-700",
};

function initCoaForm() {
  return { code: "", name: "", description: "", accountType: "asset" as CoaAccount["accountType"], subType: "", currency: "", sortOrder: "" };
}

function initJournalForm() {
  return {
    entryDate: "", description: "", entryType: "manual" as "manual" | "correction",
    lines: [
      { accountId: "", side: "debit" as "debit" | "credit", amount: "", currency: "GBP", description: "" },
      { accountId: "", side: "credit" as "debit" | "credit", amount: "", currency: "GBP", description: "" },
    ],
  };
}

export default function AccountingPage() {
  const [tab, setTab] = useState<"coa" | "journal">("coa");

  // CoA state
  const [accounts, setAccounts]   = useState<CoaAccount[]>([]);
  const [coaLoading, setCoaLoading] = useState(true);
  const [coaRefresh, setCoaRefresh] = useState(0);
  const [showCoaForm, setShowCoaForm] = useState(false);
  const [coaForm, setCoaForm]     = useState(initCoaForm());
  const [savingCoa, setSavingCoa] = useState(false);
  const [coaError, setCoaError]   = useState("");

  // Journal state
  const [entries, setEntries]       = useState<JournalEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [journalLoading, setJournalLoading] = useState(true);
  const [journalRefresh, setJournalRefresh] = useState(0);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState(initJournalForm());
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [viewEntry, setViewEntry]   = useState<JournalDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  function loadCoa() { setCoaLoading(true); setCoaRefresh((n) => n + 1); }
  function loadJournal() { setJournalLoading(true); setJournalRefresh((n) => n + 1); }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/accounting/accounts")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setAccounts(d ?? []); setCoaLoading(false); } })
      .catch(() => { if (!cancelled) setCoaLoading(false); });
    return () => { cancelled = true; };
  }, [coaRefresh]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/accounting/journal?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setEntries(d.rows ?? []);
          setTotal(d.total ?? 0);
          setPages(d.pages ?? 1);
          setJournalLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setJournalLoading(false); });
    return () => { cancelled = true; };
  }, [journalRefresh, page]);

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingCoa(true);
    setCoaError("");
    const res = await fetch("/api/accounting/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code:        coaForm.code,
        name:        coaForm.name,
        description: coaForm.description || undefined,
        accountType: coaForm.accountType,
        subType:     coaForm.subType || undefined,
        currency:    coaForm.currency || undefined,
        sortOrder:   coaForm.sortOrder ? parseInt(coaForm.sortOrder) : undefined,
      }),
    });
    const json = await res.json();
    setSavingCoa(false);
    if (!res.ok) { setCoaError(json.error ?? "Failed to add account"); return; }
    setShowCoaForm(false);
    setCoaForm(initCoaForm());
    loadCoa();
  }

  function updateLine(idx: number, key: string, value: string) {
    setJournalForm((p) => {
      const lines = [...p.lines];
      lines[idx] = { ...lines[idx], [key]: value };
      return { ...p, lines };
    });
  }

  function addLine() {
    setJournalForm((p) => ({
      ...p,
      lines: [...p.lines, { accountId: "", side: "debit", amount: "", currency: "GBP", description: "" }],
    }));
  }

  function removeLine(idx: number) {
    setJournalForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }));
  }

  async function handlePostJournal(e: React.FormEvent) {
    e.preventDefault();
    setSavingJournal(true);
    setJournalError("");
    const res = await fetch("/api/accounting/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryDate:   journalForm.entryDate,
        description: journalForm.description,
        entryType:   journalForm.entryType,
        lines:       journalForm.lines,
      }),
    });
    const json = await res.json();
    setSavingJournal(false);
    if (!res.ok) { setJournalError(json.error ?? "Failed to post entry"); return; }
    setShowJournalForm(false);
    setJournalForm(initJournalForm());
    loadJournal();
  }

  async function handleViewEntry(id: string) {
    setViewLoading(true);
    const res = await fetch(`/api/accounting/journal/${id}`);
    const d = await res.json();
    setViewEntry(d);
    setViewLoading(false);
  }

  async function handleReverseEntry(id: string) {
    await fetch(`/api/accounting/journal/${id}`, { method: "DELETE" });
    setViewEntry(null);
    loadJournal();
  }

  // Group CoA by accountType
  const grouped = accounts.reduce<Record<string, CoaAccount[]>>((acc, a) => {
    if (!acc[a.accountType]) acc[a.accountType] = [];
    acc[a.accountType].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Accounting</h1>
          <p className="text-sm text-[#64748B] mt-1">Chart of accounts and general ledger.</p>
        </div>
        <div className="flex gap-2">
          {tab === "coa" && (
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-9" onClick={() => { setShowCoaForm(true); setCoaError(""); setCoaForm(initCoaForm()); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Add account
            </Button>
          )}
          {tab === "journal" && (
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-9" onClick={() => { setShowJournalForm(true); setJournalError(""); setJournalForm(initJournalForm()); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Post entry
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {(["coa", "journal"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-[#4A8C1C] text-[#4A8C1C]" : "border-transparent text-[#64748B] hover:text-[#1A2332]"
            }`}
          >
            {t === "coa" ? "Chart of accounts" : "Journal entries"}
          </button>
        ))}
      </div>

      {/* Chart of accounts */}
      {tab === "coa" && (
        coaLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No accounts yet. Add your first account to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, accs]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`capitalize ${TYPE_COLOURS[type]}`}>{type}</Badge>
                  <span className="text-xs text-[#64748B]">{accs.length} account{accs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Code</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Sub-type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">CCY</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {accs.map((a) => (
                        <tr key={a.id} className="hover:bg-[#F8FBEF]">
                          <td className="px-4 py-2.5 font-mono text-xs text-[#1A2332]">{a.code}</td>
                          <td className="px-4 py-2.5 text-[#1A2332]">{a.name}</td>
                          <td className="px-4 py-2.5 text-xs text-[#64748B]">{a.subType ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[#64748B]">{a.currency ?? "multi"}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">
                            {parseFloat(a.balance ?? "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Journal entries */}
      {tab === "journal" && (
        journalLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No journal entries yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-[#F8FBEF] cursor-pointer transition-colors"
                    onClick={() => handleViewEntry(e.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#1A2332]">{e.entryRef}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(e.entryDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-[#1A2332] max-w-sm truncate">{e.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-[#64748B]">{e.entryType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${STATUS_COLOURS[e.status]}`}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FBEF]">
                <p className="text-xs text-[#64748B]">{total} entries</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setPage((p) => Math.max(1, p - 1)); loadJournal(); }} disabled={page === 1}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-[#64748B]">{page} / {pages}</span>
                  <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setPage((p) => Math.min(pages, p + 1)); loadJournal(); }} disabled={page === pages}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Add CoA account dialog */}
      <Dialog open={showCoaForm} onOpenChange={setShowCoaForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add account</DialogTitle></DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 py-1">
            {coaError && <p className="text-sm text-red-600">{coaError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input required value={coaForm.code} onChange={(e) => setCoaForm((p) => ({ ...p, code: e.target.value }))} placeholder="1001" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Type <span className="text-red-500">*</span></Label>
                <select required value={coaForm.accountType} onChange={(e) => setCoaForm((p) => ({ ...p, accountType: e.target.value as CoaAccount["accountType"] }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input required value={coaForm.name} onChange={(e) => setCoaForm((p) => ({ ...p, name: e.target.value }))} placeholder="Cash and bank balances" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sub-type</Label>
                <Input value={coaForm.subType} onChange={(e) => setCoaForm((p) => ({ ...p, subType: e.target.value }))} placeholder="current_asset" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency (blank = multi)</Label>
                <Input value={coaForm.currency} onChange={(e) => setCoaForm((p) => ({ ...p, currency: e.target.value }))} placeholder="GBP" maxLength={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCoaForm(false)}>Cancel</Button>
              <Button type="submit" disabled={savingCoa} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
                {savingCoa ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post journal entry dialog */}
      <Dialog open={showJournalForm} onOpenChange={setShowJournalForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Post journal entry</DialogTitle></DialogHeader>
          <form onSubmit={handlePostJournal} className="space-y-4 py-1">
            {journalError && <p className="text-sm text-red-600">{journalError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Entry date <span className="text-red-500">*</span></Label>
                <Input type="date" required value={journalForm.entryDate} onChange={(e) => setJournalForm((p) => ({ ...p, entryDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Entry type</Label>
                <select value={journalForm.entryType} onChange={(e) => setJournalForm((p) => ({ ...p, entryType: e.target.value as typeof journalForm["entryType"] }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
                  <option value="manual">Manual</option>
                  <option value="correction">Correction</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Input required value={journalForm.description} onChange={(e) => setJournalForm((p) => ({ ...p, description: e.target.value }))} />
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addLine}>+ Add line</Button>
              </div>
              <div className="space-y-2">
                {journalForm.lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Account</Label>
                      <select value={line.accountId} onChange={(e) => updateLine(i, "accountId", e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none focus:border-ring">
                        <option value="">Select…</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Side</Label>
                      <select value={line.side} onChange={(e) => updateLine(i, "side", e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none focus:border-ring">
                        <option value="debit">Dr</option>
                        <option value="credit">Cr</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Amount</Label>
                      <Input className="h-9 text-xs" type="number" step="0.01" value={line.amount} onChange={(e) => updateLine(i, "amount", e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">CCY</Label>
                      <Input className="h-9 text-xs" value={line.currency} onChange={(e) => updateLine(i, "currency", e.target.value)} maxLength={3} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {journalForm.lines.length > 2 && (
                        <Button type="button" variant="ghost" size="sm" className="h-9 text-red-500 hover:text-red-700" onClick={() => removeLine(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowJournalForm(false)}>Cancel</Button>
              <Button type="submit" disabled={savingJournal} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
                {savingJournal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View journal entry dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="sm:max-w-xl">
          {viewLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
          ) : viewEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{viewEntry.entryRef}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">{new Date(viewEntry.entryDate).toLocaleDateString("en-GB")}</span>
                  <Badge className={`text-xs ${STATUS_COLOURS[viewEntry.status]}`}>{viewEntry.status}</Badge>
                </div>
                <p className="text-sm text-[#1A2332]">{viewEntry.description}</p>
                <table className="w-full text-sm border-t border-[#E2E8F0]">
                  <thead>
                    <tr className="text-xs text-[#64748B] font-semibold">
                      <th className="text-left py-2 pr-4">Account</th>
                      <th className="text-right py-2 pr-4">Debit</th>
                      <th className="text-right py-2">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {viewEntry.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 text-[#1A2332]">
                          <span className="font-mono text-xs mr-2">{l.accountCode}</span>
                          {l.accountName}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono text-xs">
                          {l.side === "debit" ? `${l.currency} ${parseFloat(l.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : ""}
                        </td>
                        <td className="py-2 text-right font-mono text-xs">
                          {l.side === "credit" ? `${l.currency} ${parseFloat(l.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewEntry(null)}>Close</Button>
                {viewEntry.status === "posted" && (viewEntry.entryType === "manual" || viewEntry.entryType === "correction") && (
                  <Button variant="destructive" onClick={() => handleReverseEntry(viewEntry.id)}>
                    Reverse entry
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
