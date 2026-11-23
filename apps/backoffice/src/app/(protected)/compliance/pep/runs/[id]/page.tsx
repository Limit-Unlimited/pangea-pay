"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHANGE_COLOURS, CHANGE_LABELS, RUN_STATUS_COLOURS, RUN_STATUS_LABELS, formatDateTime } from "../../../sanctions/format";
import { formatPeriod } from "../../format";

type Rec = {
  names?: string[]; datesOfBirth?: string[]; nationalities?: string[]; gender?: string;
  positions?: Array<{ label: string; country: string | null; start: string | null; end: string | null }>;
  relations?: Array<{ type: string; name: string }>;
};

type Change = {
  id: string; personId: string; sourceRef: string; changeType: string; primaryName: string;
  changedFields: string[] | null; before: Rec | null; after: Rec | null;
};

type RunDetail = {
  run: {
    id: string; sourceName: string; trigger: string; status: string; forced: boolean; note: string | null;
    addedCount: number; removedCount: number; modifiedCount: number; restoredCount: number;
    personCountBefore: number | null; personCountAfter: number | null; errorMessage: string | null;
    startedAt: string; finishedAt: string | null; triggeredByEmail: string | null;
    stats: null | { positions?: number; peps?: number; rcas?: number; detailsFetched?: number; detailsReused?: number; skippedPositions?: number };
    heldChanges: Array<{ type: string; ref: string; name: string }> | null;
  };
  changes: Change[]; page: number; pages: number; total: number;
};

const selectClass = "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring";

/** One field of a record as plain text, for the before/after comparison. */
function show(rec: Rec | null, field: string): string {
  if (!rec) return "";
  switch (field) {
    case "positions": return (rec.positions ?? []).map((p) => `${p.label}${p.country ? ` (${p.country})` : ""}, ${formatPeriod(p.start, p.end)}`).join("\n");
    case "relations": return (rec.relations ?? []).map((r) => `${r.type}: ${r.name}`).join("\n");
    default: {
      const v = (rec as Record<string, unknown>)[field];
      return Array.isArray(v) ? v.join("\n") : v == null ? "" : String(v);
    }
  }
}

export default function PepRunPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData]       = useState<RunDetail | null>(null);
  const [type, setType]       = useState("");
  const [search, setSearch]   = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage]       = useState(1);
  const [open, setOpen]       = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set("type", type);
    if (applied) params.set("search", applied);
    fetch(`/api/pep/runs/${id}?${params}`).then((r) => r.json()).then(setData);
  }, [id, type, applied, page]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;
  const { run } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/compliance/pep" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#1A2332]">
          <ChevronLeft className="w-4 h-4" /> PEP database
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2332] mt-2">Update of {formatDateTime(run.startedAt)}</h1>
        <p className="text-sm text-[#64748B]">{run.sourceName}</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="text-xs text-[#64748B]">Result</p>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RUN_STATUS_COLOURS[run.status] ?? ""}`}>{RUN_STATUS_LABELS[run.status] ?? run.status}</span>
          {run.forced && <span className="ml-1 text-xs text-amber-700">safety check overridden</span>}
        </div>
        <div><p className="text-xs text-[#64748B]">Finished</p>{formatDateTime(run.finishedAt)}</div>
        <div><p className="text-xs text-[#64748B]">People before and after</p>{run.personCountBefore?.toLocaleString("en-GB") ?? "0"} to {run.personCountAfter?.toLocaleString("en-GB") ?? ""}</div>
        <div><p className="text-xs text-[#64748B]">Started by</p>{run.triggeredByEmail ?? (run.trigger === "scheduled" ? "Daily schedule" : "Server command")}</div>
        <div><p className="text-xs text-[#64748B]">Added, removed, modified, restored</p>
          {[run.addedCount, run.removedCount, run.modifiedCount, run.restoredCount].map((n) => n.toLocaleString("en-GB")).join(", ")}
        </div>
        {run.stats && (
          <div className="col-span-2 md:col-span-3"><p className="text-xs text-[#64748B]">At the source</p>
            {run.stats.positions?.toLocaleString("en-GB")} positions, {run.stats.peps?.toLocaleString("en-GB")} PEPs, {run.stats.rcas?.toLocaleString("en-GB")} relatives and associates;
            {" "}{run.stats.detailsFetched?.toLocaleString("en-GB")} records fetched, {run.stats.detailsReused?.toLocaleString("en-GB")} unchanged since the last run
            {run.stats.skippedPositions ? `; ${run.stats.skippedPositions} positions could not be queried and their holders were kept as they were` : ""}.
          </div>
        )}
        {run.note && <div className="col-span-2 md:col-span-4"><p className="text-xs text-[#64748B]">Note</p>{run.note}</div>}
        {run.errorMessage && <div className="col-span-2 md:col-span-4 text-red-700">{run.errorMessage}</div>}
      </div>

      {run.heldChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-medium text-amber-900">Nothing was applied. These changes were held back for review ({run.heldChanges.length.toLocaleString("en-GB")} shown):</p>
          <ul className="max-h-64 overflow-y-auto text-xs text-amber-900 space-y-0.5">
            {run.heldChanges.map((c, i) => <li key={i}>{CHANGE_LABELS[c.type] ?? c.type}: {c.name} ({c.ref})</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <form className="flex flex-wrap gap-2 items-center" onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(search.trim()); }}>
          <select className={selectClass} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Change type">
            <option value="">All changes</option>
            {Object.entries(CHANGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or Wikidata ID" className="w-64" />
          <Button type="submit" variant="outline" size="sm">Filter</Button>
          <span className="text-sm text-[#64748B]">{data.total.toLocaleString("en-GB")} changes</span>
        </form>

        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
          {!data.changes.length && <p className="text-sm text-[#64748B] py-8 text-center">No changes match.</p>}
          {data.changes.map((c) => {
            const fields = c.changeType === "modified" ? (c.changedFields ?? []).filter((f) => f !== "sourceUrl") : [];
            return (
              <div key={c.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CHANGE_COLOURS[c.changeType] ?? ""}`}>{CHANGE_LABELS[c.changeType] ?? c.changeType}</span>
                  <Link href={`/compliance/pep/${c.personId}`} className="font-medium text-[#1A2332] hover:text-[#4A8C1C] hover:underline">{c.primaryName}</Link>
                  <span className="text-xs text-[#64748B]">{c.sourceRef}</span>
                  {fields.length > 0 && (
                    <>
                      <span className="text-xs text-[#64748B]">changed: {fields.join(", ")}</span>
                      <button className="text-xs text-[#4A8C1C] hover:underline" onClick={() => setOpen(open === c.id ? null : c.id)}>
                        {open === c.id ? "Hide" : "Show before and after"}
                      </button>
                    </>
                  )}
                </div>
                {open === c.id && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-[10rem_1fr_1fr] gap-x-4 gap-y-2 text-xs">
                    <span className="hidden md:block text-[#64748B]" /><span className="font-semibold text-[#64748B]">Before</span><span className="font-semibold text-[#64748B]">After</span>
                    {fields.map((f) => (
                      <div key={f} className="contents">
                        <span className="text-[#64748B]">{f}</span>
                        <pre className="whitespace-pre-wrap font-sans text-red-800 bg-red-50 rounded px-2 py-1">{show(c.before, f) || "(none)"}</pre>
                        <pre className="whitespace-pre-wrap font-sans text-green-800 bg-green-50 rounded px-2 py-1">{show(c.after, f) || "(none)"}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {data.pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm text-[#64748B]">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span>Page {page} of {data.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
