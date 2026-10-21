"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ListChecks, Loader2, RefreshCw, Upload, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime, formatPublisherDate, RUN_STATUS_COLOURS, RUN_STATUS_LABELS, TRIGGER_LABELS } from "./format";

type Health = { state: "ok" } | { state: "needs_review"; reason: string };

type SanctionList = {
  code:              string;
  name:              string;
  publisher:         string;
  jurisdiction:      string;
  sourceUrl:         string;
  infoUrl:           string | null;
  isActive:          boolean;
  entryCount:        number;
  lastSuccessAt:     string | null;
  lastChangedAt:     string | null;
  lastRunId:         string | null;
  sourcePublishedAt: string | null;
  health:            Health;
};

type Run = {
  id:               string;
  listCode:         string;
  listName:         string;
  trigger:          string;
  status:           string;
  forced:           boolean;
  addedCount:       number;
  removedCount:     number;
  modifiedCount:    number;
  restoredCount:    number;
  entryCountAfter:  number | null;
  errorMessage:     string | null;
  startedAt:        string;
  triggeredByEmail: string | null;
};

const selectClass = "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring";

export default function SanctionsListsPage() {
  const [lists, setLists]         = useState<SanctionList[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [reload, setReload]       = useState(0);

  const [runs, setRuns]           = useState<Run[]>([]);
  const [runsPage, setRunsPage]   = useState(1);
  const [runsPages, setRunsPages] = useState(1);
  const [runsLoading, setRunsLoading] = useState(true);
  const [listFilter, setListFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [busyCode, setBusyCode]   = useState<string | null>(null);
  const [message, setMessage]     = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [uploadFor, setUploadFor] = useState<SanctionList | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [note, setNote]           = useState("");
  const [force, setForce]         = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sanctions/lists")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setLists(d.lists ?? []);
        setCanManage(Boolean(d.canManage));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(runsPage) });
    if (listFilter)   params.set("list", listFilter);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/sanctions/runs?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRuns(d.rows ?? []);
        setRunsPages(d.pages ?? 1);
        setRunsLoading(false);
      })
      .catch(() => { if (!cancelled) setRunsLoading(false); });
    return () => { cancelled = true; };
  }, [reload, runsPage, listFilter, statusFilter]);

  function refreshAll() { setRunsLoading(true); setReload((n) => n + 1); }

  function describeResult(r: { status: string; added: number; removed: number; modified: number; restored: number; message?: string }) {
    if (r.status === "unchanged") return "No change: the file is identical to the one already loaded.";
    if (r.status === "success") {
      return `Updated: ${r.added} added, ${r.removed} removed, ${r.modified} modified, ${r.restored} restored.`;
    }
    return r.message ?? "The update did not complete.";
  }

  async function updateNow(list: SanctionList) {
    setBusyCode(list.code);
    setMessage(null);
    try {
      const res = await fetch("/api/sanctions/update", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listCode: list.code }),
      });
      const d = await res.json();
      if (!res.ok) setMessage({ tone: "error", text: d.error ?? "The update could not start." });
      else setMessage({ tone: d.status === "success" || d.status === "unchanged" ? "ok" : "error", text: `${list.name}: ${describeResult(d)}` });
    } catch {
      setMessage({ tone: "error", text: "The update could not be reached. Check your connection and try again." });
    }
    setBusyCode(null);
    refreshAll();
  }

  function openUpload(list: SanctionList) {
    setUploadFor(list);
    setFile(null);
    setNote("");
    setForce(false);
    setUploadError("");
  }

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFor) return;
    if (!file) { setUploadError("Choose the list file to upload."); return; }
    if (!note.trim()) { setUploadError("Add a note saying where the file came from."); return; }

    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.append("file", file);
    form.append("note", note.trim());
    if (force) form.append("force", "true");

    try {
      const res = await fetch(`/api/sanctions/lists/${uploadFor.code}/upload`, { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) {
        setUploadError(d.error ?? "The file could not be processed.");
      } else if (d.status === "failed" || d.status === "rejected") {
        setUploadError(describeResult(d));
      } else {
        setMessage({ tone: "ok", text: `${uploadFor.name}: ${describeResult(d)}` });
        setUploadFor(null);
      }
    } catch {
      setUploadError("The upload could not be sent. Check your connection and try again.");
    }
    setUploading(false);
    refreshAll();
  }

  const flagged = lists.filter((l) => l.isActive && l.health.state === "needs_review");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Sanctions Lists</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Official government sanctions lists, downloaded directly from each publisher and checked daily.
        </p>
      </div>

      {!loading && flagged.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle />
          <AlertTitle>
            {flagged.length === 1 ? "1 list needs manual review" : `${flagged.length} lists need manual review`}
          </AlertTitle>
          <AlertDescription>
            <p>Screening uses the last version of each list that loaded successfully. Update these lists or upload the official file by hand.</p>
            <ul className="mt-2 space-y-1">
              {flagged.map((l) => (
                <li key={l.code}>
                  <strong>{l.name}:</strong> {l.health.state === "needs_review" ? l.health.reason : ""}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant={message.tone === "error" ? "destructive" : "default"}
          className={message.tone === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50 text-green-900"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">List</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Entries</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Confirmed current</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Last change</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Publisher&apos;s date</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {lists.map((l) => (
                <tr key={l.code} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1A2332]">
                      <span className="inline-block w-8 text-xs font-semibold text-[#64748B]">{l.jurisdiction}</span>
                      {l.name}
                    </div>
                    <div className="text-xs text-[#64748B] ml-8 flex items-center gap-1">
                      {l.publisher}
                      {l.infoUrl && (
                        <a href={l.infoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#4A8C1C] hover:underline ml-1">
                          Source <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.health.state === "ok" ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Current</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={l.health.reason}>
                        Needs review
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.entryCount.toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDateTime(l.lastSuccessAt)}</td>
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDateTime(l.lastChangedAt)}</td>
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatPublisherDate(l.sourcePublishedAt)}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-stretch">
                        <Button variant="outline" size="sm" onClick={() => updateNow(l)} disabled={busyCode !== null}>
                          {busyCode === l.code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Update now
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openUpload(l)} disabled={busyCode !== null}>
                          <Upload className="w-3.5 h-3.5" /> Upload file
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update log */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#1A2332]">Update log</h2>
            <p className="text-sm text-[#64748B]">Every update attempt, scheduled or manual. Open a row to see each addition, removal and modification.</p>
          </div>
          <div className="flex gap-2">
            <select value={listFilter} onChange={(e) => { setListFilter(e.target.value); setRunsPage(1); setRunsLoading(true); }} className={selectClass} aria-label="Filter by list">
              <option value="">All lists</option>
              {lists.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setRunsPage(1); setRunsLoading(true); }} className={selectClass} aria-label="Filter by result">
              <option value="">All results</option>
              {Object.entries(RUN_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {runsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl">
            <ListChecks className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">No updates have run yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Started</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">List</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">How</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Result</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Added</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Removed</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Modified</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Restored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FBEF]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/compliance/sanctions/runs/${r.id}`} className="text-[#4A8C1C] hover:underline">{formatDateTime(r.startedAt)}</Link>
                    </td>
                    <td className="px-4 py-3">{r.listName}</td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {TRIGGER_LABELS[r.trigger] ?? r.trigger}
                      {r.triggeredByEmail && <div className="text-xs">{r.triggeredByEmail}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RUN_STATUS_COLOURS[r.status] ?? ""}`}>
                        {RUN_STATUS_LABELS[r.status] ?? r.status}{r.forced ? " (override)" : ""}
                      </span>
                      {r.errorMessage && <div className="text-xs text-[#64748B] mt-1 max-w-md">{r.errorMessage}</div>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.addedCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.removedCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.modifiedCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.restoredCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {runsPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] text-sm text-[#64748B]">
                <span>Page {runsPage} of {runsPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={runsPage <= 1} onClick={() => { setRunsPage((p) => p - 1); setRunsLoading(true); }} aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={runsPage >= runsPages} onClick={() => { setRunsPage((p) => p + 1); setRunsLoading(true); }} aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual upload */}
      <Dialog open={uploadFor !== null} onOpenChange={(open) => { if (!open && !uploading) setUploadFor(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload list file</DialogTitle>
            <DialogDescription>
              {uploadFor?.name}. Download the XML file from the publisher&apos;s site, then upload it here. It is checked and logged in the same way as the daily update.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4 py-1">
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            {uploadFor?.infoUrl && (
              <p className="text-sm">
                <a href={uploadFor.infoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#4A8C1C] hover:underline">
                  Open the publisher&apos;s page <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="sanctions-file">XML file <span className="text-red-500">*</span></Label>
              <input id="sanctions-file" type="file" accept=".xml,application/xml,text/xml"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#F0F7E6] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#1A2332]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sanctions-note">Note <span className="text-red-500">*</span></Label>
              <Textarea id="sanctions-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="Where the file came from and why it is being uploaded by hand" />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="sanctions-force" checked={force} onCheckedChange={(v) => setForce(v === true)} />
              <label htmlFor="sanctions-force" className="text-sm text-[#1A2332] cursor-pointer">
                Apply even if the safety check fails
                <span className="block text-xs text-[#64748B]">
                  Only tick this after confirming on the publisher&apos;s site that a large number of removals is genuine.
                </span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadFor(null)} disabled={uploading}>Cancel</Button>
              <Button type="submit" disabled={uploading} className="bg-[#4A8C1C] hover:bg-[#3d7417] text-white">
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Upload and apply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
