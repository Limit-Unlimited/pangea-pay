"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type QueueItem = {
  id: string; customerRef: string; type: "individual" | "business";
  status: string; onboardingStatus: string; riskCategory: string;
  screeningStatus: string; firstName: string | null; lastName: string | null;
  legalEntityName: string | null; email: string | null;
  country: string | null; nextReviewDue: string | null; createdAt: string;
};

type ListResponse = { data: QueueItem[]; total: number; page: number; pages: number; limit: number };

const RISK_COLOURS: Record<string, string> = {
  low:    "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high:   "bg-red-100 text-red-800",
};

export default function OnboardingQueuePage() {
  const router = useRouter();
  const [data, setData]           = useState<ListResponse | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState("");
  const [type, setType]           = useState("");
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (onboardingStatus) params.set("status", onboardingStatus);
    if (type)             params.set("type", type);
    const res  = await fetch(`/api/onboarding?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, onboardingStatus, type]);

  useEffect(() => { load(); }, [load]);

  function displayName(c: QueueItem) {
    return c.type === "individual"
      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"
      : (c.legalEntityName ?? "—");
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function isReviewOverdue(dateStr: string | null) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  return (
    <div>
      <PageHeader
        title="Onboarding queue"
        description="Applications pending review and KYC action."
      />

      {/* Stats strip */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total in queue", value: data.total },
            { label: "Pending review", value: data.data.filter((r) => r.onboardingStatus === "pending").length },
            { label: "Under review", value: data.data.filter((r) => r.onboardingStatus === "under_review").length },
            { label: "High risk", value: data.data.filter((r) => r.riskCategory === "high").length },
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
        <Select value={onboardingStatus || "all"} onValueChange={(v) => { setOnboardingStatus((v ?? "") === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All onboarding statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type || "all"} onValueChange={(v) => { setType((v ?? "") === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Ref</TableHead>
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Type</TableHead>
              <TableHead className="text-[#64748B] font-medium">Onboarding status</TableHead>
              <TableHead className="text-[#64748B] font-medium">Risk</TableHead>
              <TableHead className="text-[#64748B] font-medium">Screening</TableHead>
              <TableHead className="text-[#64748B] font-medium">Review due</TableHead>
              <TableHead className="text-[#64748B] font-medium">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#64748B]">Loading…</TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#64748B]">Queue is empty.</TableCell>
              </TableRow>
            ) : data.data.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-[#F7F9FC]"
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <TableCell className="font-mono text-sm text-[#64748B]">{c.customerRef}</TableCell>
                <TableCell className="font-medium text-[#1A2332]">{displayName(c)}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize text-xs">{c.type}</Badge></TableCell>
                <TableCell><StatusBadge status={c.onboardingStatus} /></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_COLOURS[c.riskCategory] ?? ""}`}>
                    {c.riskCategory}
                  </span>
                </TableCell>
                <TableCell><StatusBadge status={c.screeningStatus} /></TableCell>
                <TableCell>
                  <span className={isReviewOverdue(c.nextReviewDue) ? "text-red-600 font-medium flex items-center gap-1" : "text-[#64748B]"}>
                    {isReviewOverdue(c.nextReviewDue) && <AlertCircle className="h-3.5 w-3.5" />}
                    {formatDate(c.nextReviewDue)}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748B]">{formatDate(c.createdAt)}</TableCell>
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
    </div>
  );
}
