"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  status: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type ListResponse = { data: User[]; total: number; page: number; pages: number; limit: number };

const STATUS_OPTIONS = ["", "active", "invited", "pending_activation", "suspended", "locked", "deactivated"];

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/users?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage backoffice user accounts and access."
        action={
          <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" onClick={() => router.push("/administration/users/new")}>
            <Plus className="mr-2 h-4 w-4" /> Invite user
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <Select value={status} onValueChange={(v) => { setStatus((v ?? "") === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="pending_activation">Pending activation</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
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
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Email</TableHead>
              <TableHead className="text-[#64748B] font-medium">Job title</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
              <TableHead className="text-[#64748B] font-medium">MFA</TableHead>
              <TableHead className="text-[#64748B] font-medium">Last login</TableHead>
              <TableHead className="text-[#64748B] font-medium">Invited</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">Loading…</TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#64748B]">No users found.</TableCell>
              </TableRow>
            ) : data.data.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-[#F8FBEF]"
                onClick={() => router.push(`/administration/users/${user.id}`)}
              >
                <TableCell className="font-medium text-[#1A2332]">{user.firstName} {user.lastName}</TableCell>
                <TableCell className="text-[#64748B]">{user.email}</TableCell>
                <TableCell className="text-[#64748B]">{user.jobTitle ?? "—"}</TableCell>
                <TableCell><StatusBadge status={user.status} /></TableCell>
                <TableCell className="text-[#64748B]">{user.mfaEnabled ? "Enabled" : "—"}</TableCell>
                <TableCell className="text-[#64748B]">{formatDate(user.lastLoginAt)}</TableCell>
                <TableCell className="text-[#64748B]">{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
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
