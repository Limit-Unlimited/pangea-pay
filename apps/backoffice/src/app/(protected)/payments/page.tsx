"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RotateCcw, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

type Transaction = {
  id:                string;
  referenceNumber:   string;
  customerId:        string;
  type:              string;
  status:            string;
  sendAmount:        string;
  sendCurrency:      string;
  receiveAmount:     string | null;
  receiveCurrency:   string | null;
  fee:               string;
  feeCurrency:       string;
  providerRef:       string | null;
  createdAt:         string;
  completedAt:       string | null;
  customerFirstName: string | null;
  customerLastName:  string | null;
  customerRef:       string | null;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  send:    <ArrowUpRight    className="w-3.5 h-3.5" />,
  receive: <ArrowDownLeft   className="w-3.5 h-3.5" />,
  convert: <ArrowLeftRight  className="w-3.5 h-3.5" />,
  refund:  <RotateCcw       className="w-3.5 h-3.5" />,
  fee:     <Minus           className="w-3.5 h-3.5" />,
};

const TYPE_COLOURS: Record<string, string> = {
  send:    "bg-blue-50 text-blue-700",
  receive: "bg-green-50 text-green-700",
  convert: "bg-purple-50 text-purple-700",
  refund:  "bg-amber-50 text-amber-700",
  fee:     "bg-slate-50 text-slate-600",
};

function fmt(n: string | null, currency?: string | null) {
  if (!n) return "—";
  const num = parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${currency} ${num}` : num;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PaymentsPage() {
  const router = useRouter();

  const [rows, setRows]           = useState<Transaction[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType]     = useState("all");

  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search)                  params.set("search", search);
    if (statusFilter !== "all")  params.set("status", statusFilter);
    if (typeFilter   !== "all")  params.set("type",   typeFilter);

    const res  = await fetch(`/api/transactions?${params}`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) { setRows(json.data ?? []); setTotal(json.total ?? 0); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View and manage all transactions across your customer base."
      />

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Reference, provider ref…"
              className="pl-8 h-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="initiated">Initiated</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="on_hold">On hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setType(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="send">Send</SelectItem>
              <SelectItem value="receive">Receive</SelectItem>
              <SelectItem value="convert">Convert</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </Card>

      {/* Stats strip */}
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} transaction{total !== 1 ? "s" : ""}
        {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
      </p>

      {/* Table */}
      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-36">Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="text-right w-36">Send amount</TableHead>
              <TableHead className="text-right w-36">Receive amount</TableHead>
              <TableHead className="w-44">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {loading ? "Loading…" : "No transactions found."}
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/payments/${row.id}`)}
              >
                <TableCell>
                  <span className="font-mono text-xs text-foreground">{row.referenceNumber}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {row.customerFirstName || row.customerLastName
                        ? `${row.customerFirstName ?? ""} ${row.customerLastName ?? ""}`.trim()
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{row.customerRef ?? "—"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLOURS[row.type] ?? "bg-slate-50 text-slate-600"}`}>
                    {TYPE_ICONS[row.type]}
                    {row.type}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {fmt(row.sendAmount, row.sendCurrency)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {row.receiveAmount ? fmt(row.receiveAmount, row.receiveCurrency) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
