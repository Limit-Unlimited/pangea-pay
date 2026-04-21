"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Alert = {
  id:           string;
  alertRef:     string;
  ruleCode:     string;
  ruleName:     string;
  severity:     "low" | "medium" | "high" | "critical";
  status:       "open" | "under_review" | "cleared" | "escalated" | "closed";
  customerId:   string;
  customerName: string | null;
  customerRef:  string | null;
  transactionId: string | null;
  createdAt:    string;
};

const SEV_COLOURS: Record<string, string> = {
  low:      "bg-slate-100 text-slate-700",
  medium:   "bg-amber-100 text-amber-800",
  high:     "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_COLOURS: Record<string, string> = {
  open:         "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-800",
  cleared:      "bg-green-100 text-green-800",
  escalated:    "bg-orange-100 text-orange-800",
  closed:       "bg-slate-100 text-slate-600",
};

export default function AlertsPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<Alert[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [severity, setSeverity] = useState("");

  function load() { setLoading(true); setRefresh((n) => n + 1); }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (search)   params.set("search", search);
    if (status)   params.set("status", status);
    if (severity) params.set("severity", severity);

    fetch(`/api/compliance/alerts?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setRows(d.rows ?? []);
          setTotal(d.total ?? 0);
          setPages(d.pages ?? 1);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh, page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Compliance Alerts</h1>
        <p className="text-sm text-[#64748B] mt-1">Transaction monitoring alerts requiring review.</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Search alert ref, rule…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-9"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); load(); }}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under review</option>
          <option value="cleared">Cleared</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); load(); }}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button type="submit" variant="outline" className="h-9">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#64748B] text-sm">No alerts found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ref</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-[#F8FBEF] cursor-pointer transition-colors"
                  onClick={() => router.push(`/compliance/alerts/${a.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#1A2332]">{a.alertRef}</td>
                  <td className="px-4 py-3 text-[#1A2332] max-w-xs truncate">{a.ruleName}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#1A2332]">{a.customerName ?? "—"}</p>
                    <p className="text-xs text-[#64748B] font-mono">{a.customerRef}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`capitalize text-xs ${SEV_COLOURS[a.severity]}`}>{a.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`capitalize text-xs ${STATUS_COLOURS[a.status]}`}>{a.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {new Date(a.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FBEF]">
              <p className="text-xs text-[#64748B]">{total} alert{total !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setPage((p) => Math.max(1, p - 1)); load(); }} disabled={page === 1}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-[#64748B]">{page} / {pages}</span>
                <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setPage((p) => Math.min(pages, p + 1)); load(); }} disabled={page === pages}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
