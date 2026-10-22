"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Decision = "pending" | "false_positive" | "true_match";

type Hit = {
  id: string; entryId: string; listCode: string; listName: string; sourceId: string;
  entryName: string; matchedName: string; queryName: string;
  score: number; nameScore: number;
  dobComparison: "match" | "same_year" | "close" | "differs" | "unknown";
  countryComparison: "match" | "differs" | "unknown";
  decision: Decision; decisionNote: string | null; decidedAt: string | null;
  decidedByName: string | null; carriedFromHitId: string | null;
};

type ListCoverage = { code: string; name: string; ok: boolean; reason: string | null };

type Result = {
  id: string; provider: string; screeningType: string; status: string;
  screenedAt: string; matchDetails: string | null; trigger: string;
  beneficiaryId: string | null; beneficiaryName: string | null;
  beneficiaryRemoved: boolean; beneficiaryStatus: string | null;
  details: null | {
    names?: string[]; dateOfBirth?: string | null; country?: string | null;
    entriesChecked?: number; thresholds?: { review: number; match: number };
    lists?: ListCoverage[];
  };
  hits: Hit[];
};

type ScreeningCustomer = { id: string; screeningStatus: string };

const SCREENING_COLOURS: Record<string, string> = {
  clear:        "bg-green-100 text-green-800",
  pending:      "bg-amber-100 text-amber-800",
  match:        "bg-red-100 text-red-800",
  review:       "bg-orange-100 text-orange-800",
  not_screened: "bg-slate-100 text-slate-600",
};

export const SCREENING_STATUS_LABELS: Record<string, string> = {
  clear:        "Clear",
  pending:      "Awaiting screening",
  match:        "Likely match",
  review:       "Needs review",
  not_screened: "Not screened",
};

const TRIGGER_LABELS: Record<string, string> = {
  manual:              "Run by a user",
  onboarding:          "Onboarding submitted",
  customer_created:    "Customer created",
  customer_updated:    "Customer details changed",
  beneficiary_created: "Beneficiary added",
  list_change:         "Sanctions list changed",
  sweep:               "Catch-up screening",
};

const DECISION_LABELS: Record<Decision, string> = {
  pending:        "Awaiting decision",
  false_positive: "Not the same person",
  true_match:     "Confirmed match",
};

const DECISION_COLOURS: Record<Decision, string> = {
  pending:        "bg-amber-100 text-amber-800",
  false_positive: "bg-green-100 text-green-800",
  true_match:     "bg-red-100 text-red-800",
};

const DOB_LABELS: Record<Hit["dobComparison"], string | null> = {
  match:     "Date of birth matches",
  same_year: "Same year of birth",
  close:     "Year of birth within one year",
  differs:   "Date of birth differs",
  unknown:   null,
};

const COUNTRY_LABELS: Record<Hit["countryComparison"], string | null> = {
  match:   "Nationality matches",
  differs: "Nationality differs",
  unknown: null,
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "Not recorded";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>{children}</span>;
}

// ---------------------------------------------------------------------------
// Listed entry details, for comparing with the customer
// ---------------------------------------------------------------------------
type EntryDetail = {
  id: string; listName: string; publisher: string; infoUrl: string | null; sourceId: string;
  isActive: boolean; removedAt: string | null;
  data: null | {
    primaryName: string; entryType: string; aliases: string[]; datesOfBirth: string[];
    placesOfBirth: string[]; nationalities: string[]; addresses: string[];
    identifiers: Array<{ type: string; number: string; country?: string }>;
    programmes: string[]; titles: string[]; gender?: string; listedOn?: string;
    reference?: string; remarks?: string;
  };
};

function EntryField({ label, values }: { label: string; values: Array<string | undefined> | undefined }) {
  const shown = (values ?? []).filter(Boolean);
  if (!shown.length) return null;
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      {shown.length === 1
        ? <p className="text-sm text-[#1A2332] break-words">{shown[0]}</p>
        : <ul className="text-sm text-[#1A2332] list-disc pl-4 space-y-0.5">{shown.map((v, i) => <li key={i} className="break-words">{v}</li>)}</ul>}
    </div>
  );
}

function EntryDialog({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entryId) return;
    setEntry(null);
    setError("");
    fetch(`/api/sanctions/entries/${entryId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load the entry");
        setEntry(json);
      })
      .catch((e: Error) => setError(e.message));
  }, [entryId]);

  const d = entry?.data;
  return (
    <Dialog open={!!entryId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{d?.primaryName ?? "Listed entry"}</DialogTitle>
        </DialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!entry && !error && <p className="text-sm text-[#64748B] py-4">Loading…</p>}
        {entry && (
          <div className="space-y-4 py-1">
            <p className="text-sm text-[#64748B]">
              {entry.listName} ({entry.publisher}), reference {entry.sourceId}
            </p>
            {!entry.isActive && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                This entry was removed from the list on {formatDateTime(entry.removedAt)}.
              </p>
            )}
            {d ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EntryField label="Type" values={[d.entryType]} />
                <EntryField label="Listed on" values={[d.listedOn]} />
                <EntryField label="Other names" values={d.aliases} />
                <EntryField label="Dates of birth" values={d.datesOfBirth} />
                <EntryField label="Places of birth" values={d.placesOfBirth} />
                <EntryField label="Nationalities" values={d.nationalities} />
                <EntryField label="Gender" values={[d.gender]} />
                <EntryField label="Titles and positions" values={d.titles} />
                <EntryField label="Identifiers" values={d.identifiers.map((i) => `${i.type}: ${i.number}${i.country ? ` (${i.country})` : ""}`)} />
                <EntryField label="Addresses" values={d.addresses} />
                <EntryField label="Sanctions programmes" values={d.programmes} />
                <EntryField label="Cross-reference" values={[d.reference]} />
                <div className="sm:col-span-2"><EntryField label="Remarks" values={[d.remarks]} /></div>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">The stored record could not be read.</p>
            )}
            {entry.infoUrl && (
              <a href={entry.infoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#4A8C1C] hover:underline">
                Publisher&apos;s list page <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Decision dialog
// ---------------------------------------------------------------------------
function DecisionDialog({ customerId, hit, onClose, onSaved }: {
  customerId: string; hit: Hit | null; onClose: () => void; onSaved: () => void;
}) {
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { setNote(""); setError(""); }, [hit?.id]);

  async function save(decision: Exclude<Decision, "pending">) {
    if (!hit) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/customers/${customerId}/screening/hits/${hit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "The decision could not be saved."); return; }
    onSaved();
  }

  const noteOk = note.trim().length >= 10;
  return (
    <Dialog open={!!hit} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Decide on this hit</DialogTitle>
        </DialogHeader>
        {hit && (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[#64748B] mb-0.5">Screened name</p>
                <p className="text-[#1A2332] font-medium">{hit.queryName}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-0.5">Listed as ({hit.listName})</p>
                <p className="text-[#1A2332] font-medium">{hit.matchedName}</p>
                {hit.matchedName !== hit.entryName && <p className="text-xs text-[#64748B]">Main name: {hit.entryName}</p>}
              </div>
            </div>
            {hit.decision !== "pending" && (
              <p className="text-xs text-[#64748B]">
                Current decision: {DECISION_LABELS[hit.decision]}. Saving replaces it, and both are kept in the audit log.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="hit-note">Reason for the decision</Label>
              <Textarea
                id="hit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What you compared, for example date of birth, nationality, address or ID documents"
                rows={4}
              />
              <p className="text-xs text-[#64748B]">Required, at least 10 characters. Recorded in the audit log.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => save("true_match")}
            disabled={saving || !noteOk}
          >
            Confirm match
          </Button>
          <Button
            className="bg-[#4A8C1C] hover:bg-[#3d7417] text-white"
            onClick={() => save("false_positive")}
            disabled={saving || !noteOk}
          >
            Not the same person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// One screening result: summary, list warnings and the hits table
// ---------------------------------------------------------------------------
function ResultCard({ title, result, onDecide, onView, action }: {
  title: React.ReactNode; result: Result;
  onDecide: (hit: Hit) => void; onView: (entryId: string) => void;
  action?: React.ReactNode;
}) {
  const pending = result.hits.filter((h) => h.decision === "pending").length;
  const listsNeedingReview = result.details?.lists?.filter((l) => !l.ok) ?? [];
  const d = result.details;

  return (
    <Card className="overflow-hidden border-[#E2E8F0]">
      <div className="p-4 space-y-3 border-b border-[#E2E8F0]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-[#1A2332] font-medium">{title}</span>
            <span className="text-[#64748B]">{formatDateTime(result.screenedAt)}</span>
            <span className="text-xs text-[#64748B]">{TRIGGER_LABELS[result.trigger] ?? result.trigger}</span>
            <Badge className={SCREENING_COLOURS[result.status] ?? ""}>{SCREENING_STATUS_LABELS[result.status] ?? result.status}</Badge>
            {pending > 0 && <span className="text-orange-700">{pending} awaiting decision</span>}
          </div>
          {action}
        </div>
        <p className="text-xs text-[#64748B]">
          Screened {d?.names?.map((n) => `"${n}"`).join(" and ") ?? "the subject"}
          {d?.dateOfBirth ? `, born ${d.dateOfBirth}` : ""}
          {d?.country ? `, country ${d.country}` : ""}
          {" "}against {d?.entriesChecked?.toLocaleString("en-GB") ?? "all"} listed entries.
          {d?.thresholds && ` Names scoring ${d.thresholds.review} or more are shown; ${d.thresholds.match} or more is a likely match.`}
        </p>
        {listsNeedingReview.length > 0 && (
          <p className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              When this screening ran, these lists needed review and may not have been current:{" "}
              {listsNeedingReview.map((l) => l.name).join(", ")}. Screen again once they are updated.
            </span>
          </p>
        )}
      </div>

      {!result.hits.length ? (
        <p className="text-sm text-[#64748B] py-6 text-center">No similar names found on any list.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
                <TableHead className="text-[#64748B] font-medium">Listed name</TableHead>
                <TableHead className="text-[#64748B] font-medium">List</TableHead>
                <TableHead className="text-[#64748B] font-medium">Score</TableHead>
                <TableHead className="text-[#64748B] font-medium">Other details</TableHead>
                <TableHead className="text-[#64748B] font-medium">Decision</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.hits.map((h) => {
                const evidence = [DOB_LABELS[h.dobComparison], COUNTRY_LABELS[h.countryComparison]].filter(Boolean);
                const likely = h.score >= (d?.thresholds?.match ?? 92);
                const multipleNames = (d?.names?.length ?? 0) > 1;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="align-top whitespace-normal min-w-[12rem]">
                      <p className="text-[#1A2332] font-medium">{h.matchedName}</p>
                      {h.matchedName !== h.entryName && <p className="text-xs text-[#64748B]">Main name: {h.entryName}</p>}
                      {multipleNames && <p className="text-xs text-[#64748B]">Matched &ldquo;{h.queryName}&rdquo;</p>}
                    </TableCell>
                    <TableCell className="align-top text-[#64748B] text-xs">
                      {h.listName}<br />Ref. {h.sourceId}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge className={likely ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>{h.score}</Badge>
                      {h.nameScore !== h.score && <p className="text-xs text-[#64748B] mt-1">Name alone: {h.nameScore}</p>}
                    </TableCell>
                    <TableCell className="align-top text-xs text-[#64748B]">
                      {evidence.length ? evidence.map((e) => <p key={e}>{e}</p>) : "Name only"}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal min-w-[12rem]">
                      <Badge className={DECISION_COLOURS[h.decision]}>{DECISION_LABELS[h.decision]}</Badge>
                      {h.decision !== "pending" && (
                        <p className="text-xs text-[#64748B] mt-1 max-w-[18rem] break-words">
                          {h.carriedFromHitId ? "Carried over from an earlier screening. " : ""}
                          {h.decidedByName ? `${h.decidedByName}, ` : ""}{formatDateTime(h.decidedAt)}
                          {h.decisionNote && <span className="block italic mt-0.5">&ldquo;{h.decisionNote}&rdquo;</span>}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => onView(h.entryId)}>View entry</Button>
                      <Button variant="outline" size="sm" className="ml-1" onClick={() => onDecide(h)}>
                        {h.decision === "pending" ? "Decide" : "Change"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screening tab
// ---------------------------------------------------------------------------
type ScreeningBeneficiary = { id: string; displayName: string; status: string; screeningStatus: string };

export function ScreeningTab({ customer, onRefresh }: { customer: ScreeningCustomer; onRefresh: () => void }) {
  const [results, setResults]   = useState<Result[]>([]);
  const [bens, setBens]         = useState<ScreeningBeneficiary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState<string | null>(null);   // "customer" or a beneficiary ID
  const [runError, setRunError] = useState("");
  const [deciding, setDeciding] = useState<Hit | null>(null);
  const [viewing, setViewing]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, benRes] = await Promise.all([
      fetch(`/api/customers/${customer.id}/screening`),
      fetch(`/api/customers/${customer.id}/beneficiaries`),
    ]);
    const json = await res.json();
    const benJson = await benRes.json().catch(() => []);
    setResults(Array.isArray(json) ? json : []);
    setBens(Array.isArray(benJson) ? benJson : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function runScreening(beneficiaryId?: string) {
    setRunning(beneficiaryId ?? "customer");
    setRunError("");
    const res = await fetch(`/api/customers/${customer.id}/screening`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(beneficiaryId ? { beneficiaryId } : {}),
    });
    const json = await res.json().catch(() => ({}));
    setRunning(null);
    if (!res.ok) setRunError(json.error ?? "Screening could not be run.");
    load();
    onRefresh();
  }

  const sanctions = results.filter((r) => r.screeningType === "sanctions" && r.provider === "pangea_sanctions");
  const latestCustomer = sanctions.find((r) => !r.beneficiaryId);
  const latestFor = (beneficiaryId: string) => sanctions.find((r) => r.beneficiaryId === beneficiaryId);
  const shownBens = bens.filter((b) => b.status !== "blocked" || latestFor(b.id));
  const removedWithResults = [...new Map(
    sanctions.filter((r) => r.beneficiaryRemoved).map((r) => [r.beneficiaryId!, r]),
  ).values()];

  const subjectName = (r: Result) =>
    !r.beneficiaryId ? "Customer" : `Beneficiary: ${r.beneficiaryName ?? "removed by the customer"}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748B]">Customer status:</span>
          <Badge className={SCREENING_COLOURS[customer.screeningStatus] ?? ""}>
            {SCREENING_STATUS_LABELS[customer.screeningStatus] ?? customer.screeningStatus}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => runScreening()} disabled={running !== null}>
          <Search className="h-3.5 w-3.5 mr-1.5" />
          {running === "customer" ? "Screening…" : "Screen customer"}
        </Button>
      </div>

      <p className="text-xs text-[#64748B]">
        Checks against the official government sanctions lists held in{" "}
        <Link href="/compliance/sanctions" className="text-[#4A8C1C] hover:underline">Sanctions lists</Link>.
        Customers are screened at onboarding and when their details change; beneficiaries when they are added;
        everyone again when a list changes. PEP, adverse media and internal watchlist screening are not available yet.
      </p>

      {runError && <p className="text-sm text-red-600">{runError}</p>}

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : (
        <>
          {latestCustomer ? (
            <ResultCard
              title="Customer: latest sanctions screening"
              result={latestCustomer}
              onDecide={setDeciding}
              onView={setViewing}
            />
          ) : (
            <p className="text-sm text-[#64748B] py-6 text-center">This customer has not been screened against the sanctions lists yet.</p>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#1A2332]">Beneficiaries</h3>
            {!shownBens.length && !removedWithResults.length && (
              <p className="text-sm text-[#64748B]">This customer has no beneficiaries.</p>
            )}
            {shownBens.map((b) => {
              const latest = latestFor(b.id);
              const screenButton = (
                <Button variant="outline" size="sm" onClick={() => runScreening(b.id)} disabled={running !== null}>
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  {running === b.id ? "Screening…" : "Screen"}
                </Button>
              );
              return latest ? (
                <ResultCard
                  key={b.id}
                  title={<>Beneficiary: {b.displayName}{b.status === "blocked" && <span className="text-[#64748B] font-normal"> (blocked)</span>}</>}
                  result={latest}
                  onDecide={setDeciding}
                  onView={setViewing}
                  action={screenButton}
                />
              ) : (
                <Card key={b.id} className="p-4 border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#1A2332] font-medium">Beneficiary: {b.displayName}</span>
                    <Badge className={SCREENING_COLOURS[b.screeningStatus] ?? ""}>
                      {SCREENING_STATUS_LABELS[b.screeningStatus] ?? b.screeningStatus}
                    </Badge>
                  </div>
                  {screenButton}
                </Card>
              );
            })}
            {removedWithResults.map((r) => (
              <ResultCard
                key={r.id}
                title={<>Beneficiary removed by the customer</>}
                result={r}
                onDecide={setDeciding}
                onView={setViewing}
              />
            ))}
          </div>
        </>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#1A2332]">Screening history</h3>
          <Card className="overflow-hidden border-[#E2E8F0]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
                    <TableHead className="text-[#64748B] font-medium">Screened at</TableHead>
                    <TableHead className="text-[#64748B] font-medium">Subject</TableHead>
                    <TableHead className="text-[#64748B] font-medium">Started by</TableHead>
                    <TableHead className="text-[#64748B] font-medium">Source</TableHead>
                    <TableHead className="text-[#64748B] font-medium">Result</TableHead>
                    <TableHead className="text-[#64748B] font-medium">Hits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-[#64748B]">{formatDateTime(r.screenedAt)}</TableCell>
                      <TableCell className="text-[#1A2332]">{subjectName(r)}</TableCell>
                      <TableCell className="text-[#64748B] text-xs">{TRIGGER_LABELS[r.trigger] ?? r.trigger}</TableCell>
                      <TableCell className="text-[#64748B] text-xs">
                        {r.provider === "pangea_sanctions" ? "Official sanctions lists" : r.provider === "mock" ? `Mock adapter, ${r.screeningType.replace(/_/g, " ")} (test data only)` : r.provider}
                      </TableCell>
                      <TableCell>
                        <Badge className={SCREENING_COLOURS[r.status] ?? ""}>{SCREENING_STATUS_LABELS[r.status] ?? r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[#64748B]">
                        {r.provider === "pangea_sanctions" ? r.hits.length : "Not recorded"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      <DecisionDialog
        customerId={customer.id}
        hit={deciding}
        onClose={() => setDeciding(null)}
        onSaved={() => { setDeciding(null); load(); onRefresh(); }}
      />
      <EntryDialog entryId={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
