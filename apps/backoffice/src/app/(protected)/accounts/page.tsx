"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, ArrowDownToLine, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Account = {
  id: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
  openDate: string | null;
  createdAt: string;
  customerId: string;
  customerRef: string | null;
  firstName: string | null;
  lastName: string | null;
  legalEntityName: string | null;
  customerType: string;
  email: string | null;
};

type ListResponse = { data: Account[]; total: number; page: number; pages: number; limit: number };

type NostroAccount = {
  id: string;
  accountRef: string;
  bankName: string;
  currency: string;
  bookBalance: string;
  status: string;
};

const STATUS_COLOURS: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  blocked:   "bg-red-100 text-red-800",
  suspended: "bg-amber-100 text-amber-800",
  pending:   "bg-slate-100 text-slate-600",
  closed:    "bg-slate-100 text-slate-500",
};

function initAdjustForm() {
  return { amount: "", direction: "credit" as "credit" | "debit", reason: "" };
}

function initFundForm() {
  return { nostroAccountId: "", amount: "", valueDate: new Date().toISOString().slice(0, 10), reference: "", reason: "" };
}

export default function AccountsPage() {
  const router = useRouter();
  const [data, setData]               = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [isLoading, setIsLoading]     = useState(true);

  // Adjust balance dialog
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const [adjustForm, setAdjustForm]     = useState(initAdjustForm());
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError]   = useState("");

  // Fund from nostro dialog
  const [fundTarget, setFundTarget]   = useState<Account | null>(null);
  const [fundForm, setFundForm]       = useState(initFundForm());
  const [fundSaving, setFundSaving]   = useState(false);
  const [fundError, setFundError]     = useState("");
  const [nostros, setNostros]         = useState<NostroAccount[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25", status: statusFilter });
    const res  = await fetch(`/api/account-requests?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function openFundDialog(account: Account) {
    setFundTarget(account);
    setFundForm(initFundForm());
    setFundError("");
    if (nostros.length === 0) {
      const res  = await fetch("/api/treasury/nostro");
      const json = await res.json() as NostroAccount[];
      setNostros(json.filter((n) => n.status === "active" && n.currency === account.currency));
    } else {
      setNostros((prev) => prev.filter((n) => n.currency === account.currency));
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustSaving(true);
    setAdjustError("");
    const res  = await fetch(`/api/accounts/${adjustTarget.id}/adjust`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(adjustForm.amount), direction: adjustForm.direction, reason: adjustForm.reason }),
    });
    const json = await res.json();
    setAdjustSaving(false);
    if (!res.ok) { setAdjustError(json.error ?? "Failed to adjust balance"); return; }
    setAdjustTarget(null);
    load();
  }

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    if (!fundTarget) return;
    setFundSaving(true);
    setFundError("");
    const res  = await fetch(`/api/accounts/${fundTarget.id}/fund`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nostroAccountId: fundForm.nostroAccountId,
        amount:          parseFloat(fundForm.amount),
        valueDate:       fundForm.valueDate,
        reference:       fundForm.reference || undefined,
        reason:          fundForm.reason,
      }),
    });
    const json = await res.json();
    setFundSaving(false);
    if (!res.ok) { setFundError(json.error ?? "Failed to fund account"); return; }
    setFundTarget(null);
    setNostros([]);
    load();
  }

  function displayName(r: Account) {
    return r.customerType === "individual"
      ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "—"
      : (r.legalEntityName ?? "—");
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const filtered = search.trim()
    ? (data?.data ?? []).filter((r) =>
        r.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
        displayName(r).toLowerCase().includes(search.toLowerCase()) ||
        r.currency.toLowerCase().includes(search.toLowerCase()) ||
        (r.email ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : (data?.data ?? []);

  const byStatus = (s: string) => (data?.data ?? []).filter((r) => r.status === s).length;

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="All customer accounts across the platform."
      />

      {/* Stats strip */}
      {data && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total",     value: data.total },
            { label: "Active",    value: byStatus("active") },
            { label: "Pending",   value: byStatus("pending") },
            { label: "Blocked",   value: byStatus("blocked") },
            { label: "Closed",    value: byStatus("closed") },
          ].map((s) => (
            <Card key={s.label} className="p-4 border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-[#1A2332]">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by account, name, currency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
              <TableHead className="text-[#64748B] font-medium">Account no.</TableHead>
              <TableHead className="text-[#64748B] font-medium">Customer</TableHead>
              <TableHead className="text-[#64748B] font-medium">Type</TableHead>
              <TableHead className="text-[#64748B] font-medium">Currency</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
              <TableHead className="text-[#64748B] font-medium">Opened</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">Loading…</TableCell>
              </TableRow>
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">No accounts found.</TableCell>
              </TableRow>
            ) : filtered.map((row) => (
              <TableRow key={row.id} className="hover:bg-[#F8FBEF]">
                <TableCell
                  className="font-mono text-sm text-[#64748B] cursor-pointer"
                  onClick={() => router.push(`/customers/${row.customerId}`)}
                >{row.accountNumber}</TableCell>
                <TableCell
                  className="cursor-pointer"
                  onClick={() => router.push(`/customers/${row.customerId}`)}
                >
                  <p className="font-medium text-[#1A2332]">{displayName(row)}</p>
                  <p className="text-xs text-[#64748B]">{row.email ?? row.customerRef ?? "—"}</p>
                </TableCell>
                <TableCell onClick={() => router.push(`/customers/${row.customerId}`)} className="cursor-pointer">
                  <Badge variant="outline" className="capitalize text-xs">{row.accountType}</Badge>
                </TableCell>
                <TableCell className="font-semibold text-[#1A2332] uppercase cursor-pointer" onClick={() => router.push(`/customers/${row.customerId}`)}>
                  {row.currency}
                </TableCell>
                <TableCell onClick={() => router.push(`/customers/${row.customerId}`)} className="cursor-pointer">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[row.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {row.status}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748B] cursor-pointer" onClick={() => router.push(`/customers/${row.customerId}`)}>
                  {formatDate(row.openDate ?? row.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Fund from nostro"
                      onClick={() => openFundDialog(row)}
                      className="h-7 px-2 text-[#64748B] hover:text-[#4A8C1C]"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Adjust balance"
                      onClick={() => { setAdjustTarget(row); setAdjustForm(initAdjustForm()); setAdjustError(""); }}
                      className="h-7 px-2 text-[#64748B] hover:text-[#4A8C1C]"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#64748B]">
          <span>Showing {((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)} of {data.total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Adjust Balance dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={(open) => { if (!open) setAdjustTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust balance — {adjustTarget?.accountNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4 py-1">
            {adjustError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{adjustError}</p>
            )}
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <div className="flex gap-2">
                {(["credit", "debit"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAdjustForm((p) => ({ ...p, direction: d }))}
                    className={`flex-1 text-sm py-2 rounded-lg border font-medium capitalize transition-colors ${adjustForm.direction === d ? (d === "credit" ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-700") : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FBEF]"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adj-amount">Amount ({adjustTarget?.currency})</Label>
              <Input
                id="adj-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adj-reason">Reason <span className="text-red-500">*</span></Label>
              <Input
                id="adj-reason"
                required
                placeholder="e.g. Correction for processing error"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={adjustSaving} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
                {adjustSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fund from Nostro dialog */}
      <Dialog open={!!fundTarget} onOpenChange={(open) => { if (!open) { setFundTarget(null); setNostros([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund account — {fundTarget?.accountNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFund} className="space-y-4 py-1">
            {fundError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{fundError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="fund-nostro">Source nostro account <span className="text-red-500">*</span></Label>
              {nostros.length === 0 ? (
                <p className="text-sm text-[#64748B]">No active {fundTarget?.currency} nostro accounts available.</p>
              ) : (
                <select
                  id="fund-nostro"
                  required
                  value={fundForm.nostroAccountId}
                  onChange={(e) => setFundForm((p) => ({ ...p, nostroAccountId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
                >
                  <option value="">Select nostro account…</option>
                  {nostros.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.accountRef} — {n.bankName} ({n.currency} {parseFloat(n.bookBalance).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} balance)
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund-amount">Amount ({fundTarget?.currency})</Label>
              <Input
                id="fund-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={fundForm.amount}
                onChange={(e) => setFundForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund-valuedate">Value date</Label>
              <Input
                id="fund-valuedate"
                type="date"
                required
                value={fundForm.valueDate}
                onChange={(e) => setFundForm((p) => ({ ...p, valueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund-ref">Reference</Label>
              <Input
                id="fund-ref"
                placeholder="e.g. CHAPS-20260421-001"
                value={fundForm.reference}
                onChange={(e) => setFundForm((p) => ({ ...p, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund-reason">Reason <span className="text-red-500">*</span></Label>
              <Input
                id="fund-reason"
                required
                placeholder="e.g. Initial account funding"
                value={fundForm.reason}
                onChange={(e) => setFundForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setFundTarget(null); setNostros([]); }}>Cancel</Button>
              <Button type="submit" disabled={fundSaving || nostros.length === 0} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
                {fundSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fund account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
