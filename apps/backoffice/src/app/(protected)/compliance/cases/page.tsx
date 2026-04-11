"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CaseRow = {
  id:           string;
  caseRef:      string;
  title:        string;
  status:       "open" | "under_investigation" | "closed" | "escalated_to_sar";
  priority:     "low" | "medium" | "high";
  customerId:   string;
  customerName: string | null;
  customerRef:  string | null;
  dueDate:      string | null;
  openedAt:     string;
  closedAt:     string | null;
};

const STATUS_COLOURS: Record<string, string> = {
  open:                "bg-blue-100 text-blue-800",
  under_investigation: "bg-amber-100 text-amber-800",
  escalated_to_sar:    "bg-red-100 text-red-800",
  closed:              "bg-slate-100 text-slate-600",
};

const PRI_COLOURS: Record<string, string> = {
  low:    "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high:   "bg-red-100 text-red-800",
};

function initForm() {
  return { customerId: "", title: "", description: "", priority: "medium" as "low" | "medium" | "high", dueDate: "" };
}

export default function CasesPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<CaseRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]       = useState(initForm());
  const [saving, setSaving]   = useState(false);
  const [createError, setCreateError] = useState("");

  function load() { setLoading(true); setRefresh((n) => n + 1); }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    fetch(`/api/compliance/cases?${params}`)
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setCreateError("");
    const res = await fetch("/api/compliance/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId:  form.customerId,
        title:       form.title,
        description: form.description || undefined,
        priority:    form.priority,
        dueDate:     form.dueDate || undefined,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setCreateError(json.error ?? "Failed to create case"); return; }
    setShowCreate(false);
    setForm(initForm());
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Compliance Cases</h1>
          <p className="text-sm text-[#64748B] mt-1">Investigation cases for suspicious activity.</p>
        </div>
        <Button
          className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white h-9"
          onClick={() => { setShowCreate(true); setCreateError(""); setForm(initForm()); }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> New case
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Search case ref, title…"
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
          <option value="under_investigation">Under investigation</option>
          <option value="escalated_to_sar">Escalated to SAR</option>
          <option value="closed">Closed</option>
        </select>
        <Button type="submit" variant="outline" className="h-9">Search</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#64748B] text-sm">No cases found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ref</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#F7F9FC] cursor-pointer transition-colors"
                  onClick={() => router.push(`/compliance/cases/${c.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#1A2332]">{c.caseRef}</td>
                  <td className="px-4 py-3 text-[#1A2332] max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#1A2332]">{c.customerName ?? "—"}</p>
                    <p className="text-xs text-[#64748B] font-mono">{c.customerRef}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`capitalize text-xs ${PRI_COLOURS[c.priority]}`}>{c.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`capitalize text-xs ${STATUS_COLOURS[c.status]}`}>{c.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {new Date(c.openedAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F7F9FC]">
              <p className="text-xs text-[#64748B]">{total} case{total !== 1 ? "s" : ""}</p>
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

      {/* Create case dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New compliance case</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-1">
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="customerId">Customer ID <span className="text-red-500">*</span></Label>
              <Input
                id="customerId"
                required
                value={form.customerId}
                onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}
                placeholder="Customer UUID"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Brief case description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed notes about the investigation…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as "low" | "medium" | "high" }))}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create case"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
