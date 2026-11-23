"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatDateTime, RUN_STATUS_COLOURS, RUN_STATUS_LABELS } from "../sanctions/format";
import { CATEGORY_LABELS, KIND_LABELS, RELATION_LABELS, formatPeriod } from "./format";

type Health = { state: "ok" } | { state: "needs_review"; reason: string };

type Source = {
  code: string; name: string; publisher: string; licence: string; sourceUrl: string;
  isActive: boolean; personCount: number; lastSuccessAt: string | null; lastChangedAt: string | null;
  lastRunId: string | null; health: Health;
};

type CountRow = { kind: "pep" | "rca"; category: string | null; current: boolean; count: number };

type Run = {
  id: string; sourceName: string; trigger: string; status: string; forced: boolean;
  addedCount: number; removedCount: number; modifiedCount: number; restoredCount: number;
  personCountAfter: number | null; errorMessage: string | null; startedAt: string; finishedAt: string | null;
};

type Position = { label: string; category: string; country: string | null; start: string | null; end: string | null };
type Link_ = { type: string; ref: string; name: string };

type Person = {
  id: string; ref: string; kind: "pep" | "rca"; primaryName: string; matchedName: string; score: number | null;
  topCategory: string | null; isCurrent: boolean; countries: string[]; datesOfBirth: string[];
  positions: Position[]; linkedTo: Link_[];
};

const selectClass = "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring";
const th = "text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs text-[#64748B]">{label}</p>
      <p className="text-2xl font-semibold text-[#1A2332] tabular-nums">{value.toLocaleString("en-GB")}</p>
    </div>
  );
}

export default function PepDatabasePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [counts, setCounts]   = useState<CountRow[]>([]);
  const [countryCount, setCountryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [runs, setRuns]           = useState<Run[]>([]);
  const [runsPage, setRunsPage]   = useState(1);
  const [runsPages, setRunsPages] = useState(1);

  const [search, setSearch]     = useState("");
  const [applied, setApplied]   = useState("");
  const [kind, setKind]         = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry]   = useState("");
  const [currentOnly, setCurrentOnly] = useState(false);
  const [people, setPeople]     = useState<Person[]>([]);
  const [peoplePage, setPeoplePage]   = useState(1);
  const [peoplePages, setPeoplePages] = useState(1);
  const [peopleTotal, setPeopleTotal] = useState(0);
  const [peopleLoading, setPeopleLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pep/sources").then((r) => r.json()).then((d) => {
      setSources(d.sources ?? []);
      setCounts(d.counts ?? []);
      setCountryCount(d.countryCount ?? 0);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/pep/runs?page=${runsPage}`).then((r) => r.json()).then((d) => {
      setRuns(d.rows ?? []);
      setRunsPages(d.pages ?? 1);
    });
  }, [runsPage]);

  const loadPeople = useCallback(() => {
    setPeopleLoading(true);
    const params = new URLSearchParams({ page: String(peoplePage) });
    if (applied) params.set("search", applied);
    if (kind) params.set("kind", kind);
    if (category) params.set("category", category);
    if (country) params.set("country", country);
    if (currentOnly) params.set("current", "1");
    fetch(`/api/pep/persons?${params}`).then((r) => r.json()).then((d) => {
      setPeople(d.rows ?? []);
      setPeoplePages(d.pages ?? 1);
      setPeopleTotal(d.total ?? 0);
      setPeopleLoading(false);
    });
  }, [applied, kind, category, country, currentOnly, peoplePage]);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  const sum = (f: (c: CountRow) => boolean) => counts.filter(f).reduce((n, c) => n + c.count, 0);
  const flagged = sources.filter((s) => s.isActive && s.health.state === "needs_review");
  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">PEP Database</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Politically exposed persons, their relatives and close associates, built from openly licensed sources and updated daily.
        </p>
      </div>

      {!loading && flagged.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle />
          <AlertTitle>{flagged.length === 1 ? "1 source needs manual review" : `${flagged.length} sources need manual review`}</AlertTitle>
          <AlertDescription>
            <p>Screening uses the last data that loaded successfully. Check the update log below.</p>
            <ul className="mt-2 space-y-1">
              {flagged.map((s) => (
                <li key={s.code}><strong>{s.name}:</strong> {s.health.state === "needs_review" ? s.health.reason : ""}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="People" value={sum(() => true)} />
            <Stat label="PEPs" value={sum((c) => c.kind === "pep")} />
            <Stat label="In office now" value={sum((c) => c.kind === "pep" && c.current)} />
            <Stat label="Relatives and close associates" value={sum((c) => c.kind === "rca")} />
            <Stat label="Countries" value={countryCount} />
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className={th}>Source</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>People</th>
                  <th className={th}>Confirmed current</th>
                  <th className={th}>Last change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sources.map((s) => (
                  <tr key={s.code} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1A2332]">{s.name}</div>
                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-1">
                        {s.publisher}. Licence: {s.licence}.
                        <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#4A8C1C] hover:underline">
                          Source <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.health.state === "ok"
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Current</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={s.health.reason}>Needs review</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.personCount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDateTime(s.lastSuccessAt)}</td>
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDateTime(s.lastChangedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-3">PEPs by highest public function</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
              {categories.map(([code, label]) => (
                <div key={code} className="flex justify-between border-b border-[#F1F5F9] py-1">
                  <span className="text-[#64748B]">{label}</span>
                  <span className="tabular-nums text-[#1A2332]">
                    {sum((c) => c.kind === "pep" && c.category === code).toLocaleString("en-GB")}
                    <span className="text-xs text-[#64748B]"> ({sum((c) => c.kind === "pep" && c.category === code && c.current).toLocaleString("en-GB")} now)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1A2332]">Search the database</h2>
        <form
          className="flex flex-wrap gap-2 items-center"
          onSubmit={(e) => { e.preventDefault(); setPeoplePage(1); setApplied(search.trim()); }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name" className="w-64" />
          <select className={selectClass} value={kind} onChange={(e) => { setKind(e.target.value); setPeoplePage(1); }} aria-label="Kind">
            <option value="">PEPs and RCAs</option>
            <option value="pep">PEPs only</option>
            <option value="rca">Relatives and associates only</option>
          </select>
          <select className={selectClass} value={category} onChange={(e) => { setCategory(e.target.value); setPeoplePage(1); }} aria-label="Category">
            <option value="">Any function</option>
            {categories.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <Input value={country} onChange={(e) => { setCountry(e.target.value.toUpperCase().slice(0, 2)); setPeoplePage(1); }} placeholder="Country (e.g. BD)" className="w-36" />
          <label className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <input type="checkbox" checked={currentOnly} onChange={(e) => { setCurrentOnly(e.target.checked); setPeoplePage(1); }} />
            In office now
          </label>
          <Button type="submit" variant="outline" size="sm"><Search className="w-3.5 h-3.5 mr-1.5" />Search</Button>
        </form>

        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
          {peopleLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
          ) : !people.length ? (
            <p className="text-sm text-[#64748B] py-10 text-center">{applied ? "No one in the database matches that name." : "No people match these filters."}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Kind</th>
                  <th className={th}>Public function or link</th>
                  <th className={th}>Born</th>
                  {applied && <th className={`${th} text-right`}>Match</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {people.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link href={`/compliance/pep/${p.id}`} className="font-medium text-[#1A2332] hover:text-[#4A8C1C] hover:underline">{p.primaryName}</Link>
                      {p.matchedName !== p.primaryName && <div className="text-xs text-[#64748B]">Matched &ldquo;{p.matchedName}&rdquo;</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.kind === "pep" ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"}`}>
                        {KIND_LABELS[p.kind]}
                      </span>
                      {p.isCurrent && <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In office</span>}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {p.kind === "pep"
                        ? p.positions.map((pos, i) => (
                            <div key={i}>{pos.label}{pos.country ? ` (${pos.country})` : ""}, {formatPeriod(pos.start, pos.end)}</div>
                          ))
                        : p.linkedTo.map((l, i) => <div key={i}>{RELATION_LABELS[l.type] ?? l.type} of {l.name}</div>)}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{p.datesOfBirth.join(", ") || "Not recorded"}</td>
                    {applied && <td className="px-4 py-3 text-right tabular-nums">{p.score}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!peopleLoading && people.length > 0 && (
          <div className="flex items-center justify-between text-sm text-[#64748B]">
            <span>{peopleTotal.toLocaleString("en-GB")} {peopleTotal === 1 ? "person" : "people"}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={peoplePage <= 1} onClick={() => setPeoplePage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span>Page {peoplePage} of {peoplePages}</span>
              <Button variant="outline" size="sm" disabled={peoplePage >= peoplePages} onClick={() => setPeoplePage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1A2332]">Update log</h2>
        <p className="text-xs text-[#64748B]">The updater runs on the server every day, with a full refresh once a week.</p>
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
          {!runs.length ? (
            <p className="text-sm text-[#64748B] py-10 text-center">No updates have run yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className={th}>Started</th>
                  <th className={th}>Result</th>
                  <th className={`${th} text-right`}>Added</th>
                  <th className={`${th} text-right`}>Removed</th>
                  <th className={`${th} text-right`}>Modified</th>
                  <th className={`${th} text-right`}>Restored</th>
                  <th className={`${th} text-right`}>People after</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {runs.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDateTime(r.startedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RUN_STATUS_COLOURS[r.status] ?? ""}`}>{RUN_STATUS_LABELS[r.status] ?? r.status}</span>
                      {r.errorMessage && <div className="text-xs text-red-700 mt-1 max-w-md">{r.errorMessage}</div>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.addedCount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.removedCount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.modifiedCount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.restoredCount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.personCountAfter?.toLocaleString("en-GB") ?? ""}</td>
                    <td className="px-4 py-3"><Link href={`/compliance/pep/runs/${r.id}`} className="text-[#4A8C1C] hover:underline whitespace-nowrap">View changes</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {runsPages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm text-[#64748B]">
            <Button variant="outline" size="sm" disabled={runsPage <= 1} onClick={() => setRunsPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span>Page {runsPage} of {runsPages}</span>
            <Button variant="outline" size="sm" disabled={runsPage >= runsPages} onClick={() => setRunsPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
