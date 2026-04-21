"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AccountRequest = {
  id: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
  openDate: string | null;
  createdAt: string;
  customerId: string;
  tenantId: string;
  customerRef: string | null;
  firstName: string | null;
  lastName: string | null;
  legalEntityName: string | null;
  customerType: string;
  email: string | null;
};

type ListResponse = { data: AccountRequest[]; total: number; page: number; pages: number; limit: number };

const STATUS_COLOURS: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  blocked:   "bg-red-100 text-red-800",
  suspended: "bg-amber-100 text-amber-800",
  pending:   "bg-slate-100 text-slate-600",
  closed:    "bg-slate-100 text-slate-500",
};

const APPROVE_STATUSES = ["active", "blocked", "suspended", "closed"] as const;
type ApproveStatus = typeof APPROVE_STATUSES[number];

export default function AccountRequestsPage() {
  const router = useRouter();
  const [data, setData]           = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Review dialog
  const [selected, setSelected]   = useState<AccountRequest | null>(null);
  const [newStatus, setNewStatus] = useState<ApproveStatus>("active");
  const [reason, setReason]       = useState("");
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25", status: statusFilter });
    const res  = await fetch(`/api/account-requests?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function displayName(r: AccountRequest) {
    return r.customerType === "individual"
      ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "—"
      : (r.legalEntityName ?? "—");
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function openDialog(row: AccountRequest) {
    setSelected(row);
    setNewStatus("active");
    setReason("");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/account-requests?id=${selected.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus, reason: reason || undefined }),
    });
    setSaving(false);
    setSelected(null);
    load();
  }

  const pending  = data?.data.filter((r) => r.status === "pending").length ?? 0;
  const active   = data?.data.filter((r) => r.status === "active").length ?? 0;
  const blocked  = data?.data.filter((r) => r.status === "blocked").length ?? 0;

  return (
    <div>
      <PageHeader
        title="Account requests"
        description="Account opening requests pending review and activation."
      />

      {/* Stats strip */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",           value: data.total },
            { label: "Pending review",  value: pending },
            { label: "Active accounts", value: active },
            { label: "Blocked",         value: blocked },
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "pending"); setPage(1); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
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
              <TableHead className="text-[#64748B] font-medium">Requested</TableHead>
              <TableHead className="text-[#64748B] font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">Loading…</TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">No account requests found.</TableCell>
              </TableRow>
            ) : data.data.map((row) => (
              <TableRow key={row.id} className="hover:bg-[#F8FBEF]">
                <TableCell className="font-mono text-sm text-[#64748B]">{row.accountNumber}</TableCell>
                <TableCell>
                  <p className="font-medium text-[#1A2332]">{displayName(row)}</p>
                  <p className="text-xs text-[#64748B]">{row.customerRef ?? "—"}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">{row.accountType}</Badge>
                </TableCell>
                <TableCell className="font-semibold text-[#1A2332] uppercase">{row.currency}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[row.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {row.status}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748B]">{formatDate(row.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#4A8C1C] text-[#4A8C1C] hover:bg-[#4A8C1C] hover:text-white"
                    onClick={() => openDialog(row)}
                  >
                    Review
                  </Button>
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

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review account request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-[#F8FBEF] border border-[#D1E8B8] p-4 space-y-1 text-sm">
                <p><span className="text-[#64748B]">Customer:</span> <span className="font-medium text-[#1A2332]">{displayName(selected)}</span></p>
                <p><span className="text-[#64748B]">Account:</span> <span className="font-mono text-[#1A2332]">{selected.accountNumber}</span></p>
                <p><span className="text-[#64748B]">Currency:</span> <span className="font-semibold uppercase text-[#1A2332]">{selected.currency}</span></p>
                <p><span className="text-[#64748B]">Current status:</span>{" "}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[selected.status] ?? ""}`}>
                    {selected.status}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newStatus">Update status to</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus((v ?? "active") as ApproveStatus)}>
                  <SelectTrigger id="newStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active — approve and activate</SelectItem>
                    <SelectItem value="blocked">Blocked — block account</SelectItem>
                    <SelectItem value="suspended">Suspended — temporarily suspend</SelectItem>
                    <SelectItem value="closed">Closed — close account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason <span className="text-[#64748B] font-normal">(optional)</span></Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a note for the audit log…"
                  className="resize-none h-20"
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
