"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Customer = {
  id: string;
  customerRef: string;
  type: "individual" | "business";
  status: string;
  onboardingStatus: string;
  riskCategory: string;
  screeningStatus: string;
  isBlacklisted: boolean;
  firstName: string | null;
  lastName: string | null;
  legalEntityName: string | null;
  email: string | null;
  country: string | null;
  createdAt: string;
};

type ListResponse = { data: Customer[]; total: number; page: number; pages: number; limit: number };

const RISK_COLOURS: Record<string, string> = {
  low:    "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high:   "bg-red-100 text-red-800",
};

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData]       = useState<ListResponse | null>(null);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [type, setType]       = useState("");
  const [risk, setRisk]       = useState("");
  const [page, setPage]       = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (type)   params.set("type", type);
    if (risk)   params.set("risk", risk);
    const res  = await fetch(`/api/customers?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, search, status, type, risk]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function displayName(c: Customer) {
    return c.type === "individual"
      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"
      : (c.legalEntityName ?? "—");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer records, onboarding, and compliance status."
        action={
          <Button
            className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            onClick={() => router.push("/customers/new")}
          >
            <Plus className="mr-2 h-4 w-4" /> Add customer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              placeholder="Search by name, email, or ref…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>

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

        <Select value={status || "all"} onValueChange={(v) => { setStatus((v ?? "") === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={risk || "all"} onValueChange={(v) => { setRisk((v ?? "") === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All risk levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
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
              <TableHead className="text-[#64748B] font-medium">Ref</TableHead>
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Type</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
              <TableHead className="text-[#64748B] font-medium">Onboarding</TableHead>
              <TableHead className="text-[#64748B] font-medium">Risk</TableHead>
              <TableHead className="text-[#64748B] font-medium">Screening</TableHead>
              <TableHead className="text-[#64748B] font-medium">Country</TableHead>
              <TableHead className="text-[#64748B] font-medium">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#64748B]">Loading…</TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#64748B]">No customers found.</TableCell>
              </TableRow>
            ) : data.data.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-[#F8FBEF]"
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <TableCell className="font-mono text-sm text-[#64748B]">{c.customerRef}</TableCell>
                <TableCell>
                  <span className="font-medium text-[#1A2332]">{displayName(c)}</span>
                  {c.isBlacklisted && (
                    <AlertTriangle className="inline ml-1.5 h-3.5 w-3.5 text-red-500" aria-label="Blacklisted" />
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">{c.type}</Badge>
                </TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell><StatusBadge status={c.onboardingStatus} /></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_COLOURS[c.riskCategory] ?? ""}`}>
                    {c.riskCategory}
                  </span>
                </TableCell>
                <TableCell><StatusBadge status={c.screeningStatus} /></TableCell>
                <TableCell className="text-[#64748B] uppercase text-xs">{c.country ?? "—"}</TableCell>
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
