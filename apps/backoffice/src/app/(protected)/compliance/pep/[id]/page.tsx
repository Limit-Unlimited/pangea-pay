"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import { formatDateTime } from "../../sanctions/format";
import { CATEGORY_LABELS, KIND_LABELS, RELATION_LABELS, formatPeriod } from "../format";

type Position = { ref: string; label: string; category: string; country: string | null; start: string | null; end: string | null };
type Relation = { type: string; ref: string; name: string; personId: string | null; linkedKind: string | null };

type Detail = {
  person: {
    id: string; sourceRef: string; kind: "pep" | "rca"; primaryName: string; isActive: boolean; isCurrent: boolean;
    removedAt: string | null; updatedAt: string; sourceName: string; licence: string; sourceModifiedAt: string | null;
  };
  record: {
    names: string[]; datesOfBirth: string[]; nationalities: string[]; gender?: string;
    positions: Position[]; sourceUrl: string;
  };
  relations: Relation[];
  history: Array<{ id: string; runId: string; changeType: string; changedFields: string[] | null; startedAt: string }>;
};

const CHANGE_LABELS: Record<string, string> = { added: "Added", removed: "Removed", modified: "Modified", restored: "Restored" };
const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      <div className="text-sm text-[#1A2332]">{children}</div>
    </div>
  );
}

export default function PepPersonPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch(`/api/pep/persons/${id}`).then(async (r) => {
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "This person could not be loaded.");
      else setDetail(d);
    });
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!detail) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;

  const { person, record, relations, history } = detail;
  const otherNames = record.names.filter((n) => n !== person.primaryName);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/compliance/pep" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#1A2332]">
          <ChevronLeft className="w-4 h-4" /> PEP database
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2332] mt-2">{person.primaryName}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${person.kind === "pep" ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"}`}>
            {KIND_LABELS[person.kind]}
          </span>
          {person.isCurrent && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In office</span>}
          {!person.isActive && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              No longer in the database since {formatDateTime(person.removedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Other names">{otherNames.length ? otherNames.join("; ") : "None recorded"}</Field>
        <Field label="Date of birth">{record.datesOfBirth.join(", ") || "Not recorded"}</Field>
        <Field label="Nationality">{record.nationalities.join(", ") || "Not recorded"}</Field>
        <Field label="Gender">{record.gender ? GENDER_LABELS[record.gender] ?? record.gender : "Not recorded"}</Field>
        <Field label="Source">
          {person.sourceName} ({person.licence}){" "}
          <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#4A8C1C] hover:underline">
            {person.sourceRef} <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </Field>
        <Field label="Last edited at the source">{formatDateTime(person.sourceModifiedAt)}</Field>
      </div>

      {person.kind === "pep" && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[#1A2332]">Public functions</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FBEF] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Country</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {record.positions.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-[#1A2332]">{p.label}</td>
                    <td className="px-4 py-3 text-[#64748B]">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.country ?? "Not recorded"}</td>
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatPeriod(p.start, p.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[#1A2332]">
          {person.kind === "pep" ? "Relatives and close associates" : "Linked PEPs"}
        </h2>
        {!relations.length ? (
          <p className="text-sm text-[#64748B]">None recorded at the source.</p>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {relations.map((r) => (
              <div key={`${r.ref}:${r.type}`} className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                <span>
                  {person.kind === "pep"
                    ? <><span className="text-[#64748B]">{RELATION_LABELS[r.type] ?? r.type}:</span> </>
                    : <span className="text-[#64748B]">{RELATION_LABELS[r.type] ?? r.type} of </span>}
                  {r.personId
                    ? <Link href={`/compliance/pep/${r.personId}`} className="text-[#1A2332] font-medium hover:text-[#4A8C1C] hover:underline">{r.name}</Link>
                    : <span className="text-[#1A2332] font-medium">{r.name}</span>}
                </span>
                {r.linkedKind && <span className="text-xs text-[#64748B]">{KIND_LABELS[r.linkedKind]}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[#1A2332]">Change history</h2>
        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
          {history.map((h) => (
            <div key={h.id} className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#1A2332]">
                {CHANGE_LABELS[h.changeType] ?? h.changeType}
                {h.changedFields?.length ? <span className="text-[#64748B]"> ({h.changedFields.join(", ")})</span> : null}
              </span>
              <Link href={`/compliance/pep/runs/${h.runId}`} className="text-xs text-[#4A8C1C] hover:underline">{formatDateTime(h.startedAt)}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
