"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CHANGE_COLOURS, CHANGE_LABELS, RUN_STATUS_COLOURS, RUN_STATUS_LABELS, TRIGGER_LABELS, formatDateTime, formatPublisherDate,
} from "../../format";

type Entry = Record<string, unknown>;

type Change = {
  id:            string;
  sourceId:      string;
  changeType:    "added" | "removed" | "modified" | "restored";
  primaryName:   string;
  changedFields: string[];
  before:        Entry | null;
  after:         Entry | null;
};

type Run = {
  id:                string;
  listCode:          string;
  listName:          string;
  sourceUrl:         string;
  trigger:           string;
  status:            string;
  forced:            boolean;
  note:              string | null;
  fileName:          string | null;
  fileHash:          string | null;
  fileBytes:         number | null;
  sourcePublishedAt: string | null;
  entryCountBefore:  number | null;
  entryCountAfter:   number | null;
  addedCount:        number;
  removedCount:      number;
  modifiedCount:     number;
  restoredCount:     number;
  errorMessage:      string | null;
  startedAt:         string;
  finishedAt:        string | null;
  triggeredByEmail:  string | null;
  isLatestRun:       boolean;
};

const FIELD_LABELS: Record<string, string> = {
  primaryName:   "Name",
  aliases:       "Aliases",
  entryType:     "Type",
  datesOfBirth:  "Dates of birth",
  placesOfBirth: "Places of birth",
  nationalities: "Nationalities",
  addresses:     "Addresses",
  identifiers:   "Identifiers",
  programmes:    "Programmes",
  titles:        "Titles and positions",
  gender:        "Gender",
  listedOn:      "Listed on",
  reference:     "Reference",
  remarks:       "Remarks",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

function show(value: unknown): string {
  if (value === undefined || value === null || value === "") return "None";
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return value.map((v) => (typeof v === "object" && v ? Object.values(v).join(", ") : String(v))).join("\n");
  }
  return String(value);
}

function items(value: unknown): string[] {
  return show(value) === "None" ? [] : show(value).split("\n");
}

/**
 * One side of a before/after comparison. Values only on this side are
 * emphasised (bold for an addition, struck through for a removal), so a
 * single changed alias stands out in a long list.
 */
function DiffSide({ value, other, side }: { value: unknown; other: unknown; side: "before" | "after" }) {
  const mine = items(value);
  if (mine.length === 0) return <span className="text-[#64748B]">None</span>;
  const theirs = new Set(items(other));
  return (
    <ul className="space-y-0.5">
      {mine.map((v, i) => {
        const changed = !theirs.has(v);
        const cls = !changed ? "text-[#64748B]"
          : side === "after" ? "font-semibold text-green-800" : "line-through text-red-800";
        return <li key={i} className={cls}>{v}</li>;
      })}
    </ul>
  );
}

/** Before/after for the fields that changed, or the whole record for an addition or removal. */
function ChangeDetail({ change }: { change: Change }) {
  const fields = change.changeType === "modified" || change.changeType === "restored"
    ? FIELD_ORDER.filter((f) => change.changedFields.includes(f))
    : FIELD_ORDER.filter((f) => {
        const value = (change.after ?? change.before)?.[f];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });

  const twoColumns = change.before && change.after;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[#64748B]">
          <th className="text-left font-semibold py-1 pr-4 w-40">Field</th>
          {twoColumns ? (
            <>
              <th className="text-left font-semibold py-1 pr-4">Before</th>
              <th className="text-left font-semibold py-1">After</th>
            </>
          ) : (
            <th className="text-left font-semibold py-1">{change.after ? "As added" : "As it was before removal"}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f} className="align-top border-t border-[#F1F5F9]">
            <td className="py-1.5 pr-4 font-medium text-[#1A2332]">{FIELD_LABELS[f]}</td>
            {twoColumns ? (
              <>
                <td className="py-1.5 pr-4 whitespace-pre-wrap"><DiffSide value={change.before?.[f]} other={change.after?.[f]} side="before" /></td>
                <td className="py-1.5 whitespace-pre-wrap"><DiffSide value={change.after?.[f]} other={change.before?.[f]} side="after" /></td>
              </>
            ) : (
              <td className="py-1.5 whitespace-pre-wrap">{show((change.after ?? change.before)?.[f])}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SanctionsRunPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun]         = useState<Run | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [type, setType]       = useState("");
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState<string | null>(null);

  const [canManage, setCanManage] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideResult, setOverrideResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/sanctions/lists").then((r) => r.json()).then((d) => setCanManage(Boolean(d.canManage))).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (type)  params.set("type", type);
    if (query) params.set("search", query);
    fetch(`/api/sanctions/runs/${id}?${params}`)
      .then(async (r) => {
        if (r.status === 404) { if (!cancelled) { setNotFound(true); setLoading(false); } return; }
        const d = await r.json();
        if (cancelled) return;
        setRun(d.run);
        setChanges(d.changes ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, page, type, query]);

  async function applyAnyway(e: React.FormEvent) {
    e.preventDefault();
    if (!run || !overrideNote.trim()) return;
    setOverriding(true);
    setOverrideResult(null);
    try {
      const res = await fetch("/api/sanctions/update", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listCode: run.listCode, force: true, note: overrideNote.trim() }),
      });
      const d = await res.json();
      if (!res.ok || d.status === "failed") {
        setOverrideResult({ tone: "error", text: d.error ?? d.message ?? "The update did not complete." });
      } else {
        setOverrideResult({ tone: "ok", text: "Applied. The new update is in the log with its own change list." });
      }
    } catch {
      setOverrideResult({ tone: "error", text: "The update could not be reached. Check your connection and try again." });
    }
    setOverriding(false);
  }

  if (loading && !run) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;
  }
  if (notFound || !run) {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748B] text-sm">This update could not be found.</p>
        <Link href="/compliance/sanctions" className="text-sm text-[#4A8C1C] hover:underline">Back to sanctions lists</Link>
      </div>
    );
  }

  const facts: [string, string][] = [
    ["How",                  `${TRIGGER_LABELS[run.trigger] ?? run.trigger}${run.triggeredByEmail ? ` by ${run.triggeredByEmail}` : ""}`],
    ["Started",              formatDateTime(run.startedAt)],
    ["Finished",             run.finishedAt ? formatDateTime(run.finishedAt) : "Not finished"],
    ["Publisher's date",     formatPublisherDate(run.sourcePublishedAt)],
    ["Entries before",       run.entryCountBefore?.toLocaleString("en-GB") ?? "None"],
    ["Entries after",        run.entryCountAfter?.toLocaleString("en-GB") ?? "None"],
    ["File",                 run.fileName ?? (run.fileBytes ? "Downloaded from publisher" : "None")],
    ["File size",            run.fileBytes ? `${(run.fileBytes / 1024 / 1024).toFixed(1)} MB` : "None"],
    ["File SHA-256",         run.fileHash ?? "None"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/compliance/sanctions" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#1A2332]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Sanctions lists
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2332] mt-2">{run.listName}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RUN_STATUS_COLOURS[run.status] ?? ""}`}>
            {RUN_STATUS_LABELS[run.status] ?? run.status}{run.forced ? " (safety check overridden)" : ""}
          </span>
        </div>
      </div>

      {run.errorMessage && (
        <Alert variant={run.status === "success" ? "default" : "destructive"} className={run.status === "success" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}>
          <AlertDescription>{run.errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([["Added", run.addedCount], ["Removed", run.removedCount], ["Modified", run.modifiedCount], ["Restored", run.restoredCount]] as const).map(([label, n]) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{label}</div>
            <div className="text-2xl font-semibold text-[#1A2332] tabular-nums">{n.toLocaleString("en-GB")}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-[#64748B]">{k}</dt>
              <dd className="text-[#1A2332] break-all">{v}</dd>
            </div>
          ))}
        </dl>
        {run.note && (
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] text-sm">
            <span className="text-xs text-[#64748B] block">Note</span>
            {run.note}
          </div>
        )}
      </div>

      {run.status === "rejected" && canManage && run.isLatestRun && run.trigger === "manual_upload" && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription>
            Nothing from this file was applied. If you have confirmed on the publisher&apos;s site that the changes are genuine,
            upload the file again from the <Link href="/compliance/sanctions" className="text-[#4A8C1C] hover:underline">sanctions lists page</Link> and
            tick &ldquo;Apply even if the safety check fails&rdquo;.
          </AlertDescription>
        </Alert>
      )}

      {run.status === "rejected" && canManage && run.isLatestRun && run.trigger !== "manual_upload" && (
        <form onSubmit={applyAnyway} className="bg-white border border-amber-200 rounded-xl px-4 py-4 space-y-3">
          <div>
            <h2 className="font-semibold text-[#1A2332]">Apply this list anyway</h2>
            <p className="text-sm text-[#64748B]">
              Nothing from this file was applied. If you have confirmed on the publisher&apos;s site that the changes are genuine,
              download the list again and apply it without the safety check. The publisher&apos;s current file is used, and the
              new update is logged separately.
            </p>
          </div>
          {overrideResult && (
            <p className={`text-sm ${overrideResult.tone === "error" ? "text-red-600" : "text-green-700"}`}>{overrideResult.text}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="override-note">Reason <span className="text-red-500">*</span></Label>
            <Textarea id="override-note" rows={2} value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)}
              placeholder="What you checked and why the removals are genuine" />
          </div>
          <Button type="submit" disabled={overriding || !overrideNote.trim()} className="bg-[#4A8C1C] hover:bg-[#3d7417] text-white">
            {overriding && <Loader2 className="w-4 h-4 animate-spin" />} Download and apply
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#1A2332]">
            {run.status === "rejected" ? "Changes that were held back" : "Changes"}{" "}
            <span className="text-sm font-normal text-[#64748B]">({total.toLocaleString("en-GB")})</span>
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }} className="flex gap-2">
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by change type"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring">
              <option value="">All changes</option>
              {Object.entries(CHANGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or ID…" className="w-56 h-9" />
            <Button type="submit" variant="outline" className="h-9">Search</Button>
          </form>
        </div>

        {run.status === "rejected" && (
          <p className="text-sm text-[#64748B]">
            Check these against the publisher&apos;s own list before applying. Full before and after records are kept only for applied updates.
          </p>
        )}
        {changes.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl">
            <ListChecks className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">No entry changes in this update.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Publisher&apos;s ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Fields changed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {changes.map((c) => (
                  <Fragment key={c.id}>
                    <tr className={c.before || c.after ? "hover:bg-[#F8FBEF] cursor-pointer" : ""}
                      onClick={() => { if (c.before || c.after) setOpen(open === c.id ? null : c.id); }}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CHANGE_COLOURS[c.changeType]}`}>
                          {CHANGE_LABELS[c.changeType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1A2332]">{c.primaryName}</td>
                      <td className="px-4 py-3 text-[#64748B] font-mono text-xs">{c.sourceId}</td>
                      <td className="px-4 py-3 text-[#64748B]">{c.changedFields.map((f) => FIELD_LABELS[f] ?? f).join(", ")}</td>
                      <td className="px-4 py-3 text-right">
                        {(c.before || c.after) && <button type="button" aria-label={open === c.id ? "Hide details" : "Show details"} aria-expanded={open === c.id}
                          className="text-[#64748B] hover:text-[#1A2332]">
                          {open === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>}
                      </td>
                    </tr>
                    {open === c.id && (
                      <tr className="bg-[#FCFDF8]">
                        <td colSpan={5} className="px-4 py-3"><ChangeDetail change={c} /></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] text-sm text-[#64748B]">
                <span>Page {page} of {pages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
