"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle, ChevronLeft, FileText, RefreshCw, ShieldAlert,
  ShieldCheck, Users, Activity, DollarSign, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Customer = {
  id: string; customerRef: string; type: "individual" | "business";
  status: string; onboardingStatus: string; riskCategory: string;
  screeningStatus: string; isBlacklisted: boolean; blacklistReason: string | null;
  firstName: string | null; lastName: string | null; dateOfBirth: string | null;
  nationality: string | null; countryOfResidence: string | null;
  occupation: string | null; employerName: string | null;
  legalEntityName: string | null; tradingName: string | null;
  registrationNumber: string | null; incorporationCountry: string | null;
  incorporationDate: string | null; businessType: string | null; businessSector: string | null;
  email: string | null; phone: string | null;
  addressLine1: string | null; addressLine2: string | null;
  city: string | null; postCode: string | null; country: string | null;
  sourceOfFunds: string | null; segment: string | null;
  nextReviewDue: string | null; createdAt: string; updatedAt: string;
};
type Document   = Record<string, any>;
type Assessment = Record<string, any>;
type Screening  = Record<string, any>;
type LinkedUser = Record<string, any>;
type SarRecord  = Record<string, any>;
type Commission = Record<string, any>;
type AuditLog   = Record<string, any>;

const RISK_COLOURS: Record<string, string> = {
  low:    "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high:   "bg-red-100 text-red-800",
};

const SCREENING_COLOURS: Record<string, string> = {
  clear:        "bg-green-100 text-green-800",
  pending:      "bg-amber-100 text-amber-800",
  match:        "bg-red-100 text-red-800",
  review:       "bg-orange-100 text-orange-800",
  not_screened: "bg-slate-100 text-slate-600",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      <p className="text-sm text-[#1A2332]">{value || "—"}</p>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Profile tab
// ---------------------------------------------------------------------------
function ProfileTab({ customer, onRefresh }: { customer: Customer; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<Partial<Customer>>(customer);
  const [error, setError]     = useState("");

  async function save() {
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Save failed"); return; }
    setEditing(false);
    onRefresh();
  }

  function f(field: keyof Customer, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-2">
            {error && <p className="text-sm text-red-600 self-center mr-2">{error}</p>}
            <Button variant="outline" onClick={() => { setEditing(false); setForm(customer); }}>Cancel</Button>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>
        )}
      </div>

      {customer.type === "individual" ? (
        <Card className="p-6 border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-4">Personal details</h3>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>First name</Label><Input value={form.firstName ?? ""} onChange={(e) => f("firstName", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Last name</Label><Input value={form.lastName ?? ""} onChange={(e) => f("lastName", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Date of birth</Label><Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => f("dateOfBirth", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Nationality (ISO)</Label><Input maxLength={2} value={form.nationality ?? ""} onChange={(e) => f("nationality", e.target.value.toUpperCase())} /></div>
              <div className="space-y-1.5"><Label>Country of residence (ISO)</Label><Input maxLength={2} value={form.countryOfResidence ?? ""} onChange={(e) => f("countryOfResidence", e.target.value.toUpperCase())} /></div>
              <div className="space-y-1.5"><Label>Occupation</Label><Input value={form.occupation ?? ""} onChange={(e) => f("occupation", e.target.value)} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Employer name</Label><Input value={form.employerName ?? ""} onChange={(e) => f("employerName", e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Full name" value={`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()} />
              <Field label="Date of birth" value={formatDate(customer.dateOfBirth)} />
              <Field label="Nationality" value={customer.nationality} />
              <Field label="Country of residence" value={customer.countryOfResidence} />
              <Field label="Occupation" value={customer.occupation} />
              <Field label="Employer" value={customer.employerName} />
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-4">Business details</h3>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2"><Label>Legal entity name</Label><Input value={form.legalEntityName ?? ""} onChange={(e) => f("legalEntityName", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Trading name</Label><Input value={form.tradingName ?? ""} onChange={(e) => f("tradingName", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Registration number</Label><Input value={form.registrationNumber ?? ""} onChange={(e) => f("registrationNumber", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Incorporation country (ISO)</Label><Input maxLength={2} value={form.incorporationCountry ?? ""} onChange={(e) => f("incorporationCountry", e.target.value.toUpperCase())} /></div>
              <div className="space-y-1.5"><Label>Incorporation date</Label><Input type="date" value={form.incorporationDate ?? ""} onChange={(e) => f("incorporationDate", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Business type</Label><Input value={form.businessType ?? ""} onChange={(e) => f("businessType", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Business sector</Label><Input value={form.businessSector ?? ""} onChange={(e) => f("businessSector", e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Legal entity name" value={customer.legalEntityName} />
              <Field label="Trading name" value={customer.tradingName} />
              <Field label="Registration number" value={customer.registrationNumber} />
              <Field label="Incorporation country" value={customer.incorporationCountry} />
              <Field label="Incorporation date" value={formatDate(customer.incorporationDate)} />
              <Field label="Business type" value={customer.businessType} />
              <Field label="Business sector" value={customer.businessSector} />
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A2332] mb-4">Contact and address</h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => f("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => f("phone", e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Address line 1</Label><Input value={form.addressLine1 ?? ""} onChange={(e) => f("addressLine1", e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Address line 2</Label><Input value={form.addressLine2 ?? ""} onChange={(e) => f("addressLine2", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => f("city", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Post code</Label><Input value={form.postCode ?? ""} onChange={(e) => f("postCode", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Country (ISO)</Label><Input maxLength={2} value={form.country ?? ""} onChange={(e) => f("country", e.target.value.toUpperCase())} /></div>
            <div className="space-y-1.5"><Label>Source of funds</Label><Input value={form.sourceOfFunds ?? ""} onChange={(e) => f("sourceOfFunds", e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-4 gap-x-6">
            <Field label="Email" value={customer.email} />
            <Field label="Phone" value={customer.phone} />
            <Field label="Address" value={[customer.addressLine1, customer.addressLine2, customer.city, customer.postCode, customer.country].filter(Boolean).join(", ")} />
            <Field label="Source of funds" value={customer.sourceOfFunds} />
            <Field label="Segment" value={customer.segment} />
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents tab
// ---------------------------------------------------------------------------
function DocumentsTab({ customerId }: { customerId: string }) {
  const [docs, setDocs]           = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);
  const [rejection, setRejection] = useState("");
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}/documents`);
    const json = await res.json();
    setDocs(json);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  async function review(docId: string, status: "accepted" | "rejected") {
    if (status === "rejected" && !rejection) return;
    setSaving(true);
    await fetch(`/api/customers/${customerId}/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason: rejection || undefined }),
    });
    setSaving(false);
    setReviewDoc(null);
    setRejection("");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#64748B]">{docs.length} document{docs.length !== 1 ? "s" : ""} on file</p>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !docs.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No documents uploaded.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Type</TableHead>
                <TableHead className="text-[#64748B] font-medium">Document number</TableHead>
                <TableHead className="text-[#64748B] font-medium">Expiry</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Uploaded</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-[#1A2332] capitalize">{doc.documentType?.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-[#64748B]">{doc.documentNumber ?? "—"}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(doc.expiryDate)}</TableCell>
                  <TableCell><StatusBadge status={doc.status} /></TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(doc.createdAt)}</TableCell>
                  <TableCell>
                    {doc.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => setReviewDoc(doc)}>Review</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewDoc} onOpenChange={(open) => { if (!open) { setReviewDoc(null); setRejection(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[#64748B]">
              Document: <span className="font-medium text-[#1A2332] capitalize">{reviewDoc?.documentType?.replace(/_/g, " ")}</span>
            </p>
            <div className="space-y-1.5">
              <Label>Rejection reason (required if rejecting)</Label>
              <Textarea
                value={rejection}
                onChange={(e) => setRejection(e.target.value)}
                placeholder="State the reason for rejection…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setReviewDoc(null); setRejection(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => review(reviewDoc!.id, "rejected")}
              disabled={saving || !rejection}
            >
              Reject
            </Button>
            <Button
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              onClick={() => review(reviewDoc!.id, "accepted")}
              disabled={saving}
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk tab
// ---------------------------------------------------------------------------
function RiskTab({ customer, onRefresh }: { customer: Customer; onRefresh: () => void }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ riskCategory: "low", score: "", notes: "" });
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/risk-assessments`);
    const json = await res.json();
    setAssessments(json);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    setSaving(true);
    await fetch(`/api/customers/${customer.id}/risk-assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        riskCategory: form.riskCategory,
        score: form.score ? Number(form.score) : undefined,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ riskCategory: "low", score: "", notes: "" });
    load();
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748B]">Current risk category:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_COLOURS[customer.riskCategory] ?? ""}`}>
            {customer.riskCategory}
          </span>
          {customer.nextReviewDue && (
            <span className="text-xs text-[#64748B]">Next review: {formatDate(customer.nextReviewDue)}</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New assessment"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-[#E2E8F0]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Risk category</Label>
              <Select value={form.riskCategory} onValueChange={(v) => setForm((p) => ({ ...p, riskCategory: v as "low" | "medium" | "high" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Score (0–100, optional)</Label>
              <Input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <Button className="mt-3 bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Submit assessment"}
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !assessments.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No risk assessments recorded.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Risk category</TableHead>
                <TableHead className="text-[#64748B] font-medium">Score</TableHead>
                <TableHead className="text-[#64748B] font-medium">Next review</TableHead>
                <TableHead className="text-[#64748B] font-medium">Notes</TableHead>
                <TableHead className="text-[#64748B] font-medium">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_COLOURS[a.riskCategory] ?? ""}`}>
                      {a.riskCategory}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{a.score ?? "—"}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(a.nextReviewDue)}</TableCell>
                  <TableCell className="text-[#64748B] max-w-xs truncate">{a.notes ?? "—"}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDateTime(a.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screening tab
// ---------------------------------------------------------------------------
function ScreeningTab({ customer, onRefresh }: { customer: Customer; onRefresh: () => void }) {
  const [results, setResults] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/screening`);
    const json = await res.json();
    setResults(json);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function runScreening() {
    setRunning(true);
    await fetch(`/api/customers/${customer.id}/screening`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setRunning(false);
    load();
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748B]">Overall status:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SCREENING_COLOURS[customer.screeningStatus] ?? ""}`}>
            {customer.screeningStatus.replace(/_/g, " ")}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runScreening}
          disabled={running}
        >
          <Search className="h-3.5 w-3.5 mr-1.5" />
          {running ? "Screening…" : "Run screening"}
        </Button>
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        Mock screening adapter active. Connect a live provider in Sprint 7.
      </p>

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !results.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No screening results. Run a screening to begin.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Type</TableHead>
                <TableHead className="text-[#64748B] font-medium">Provider</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Match details</TableHead>
                <TableHead className="text-[#64748B] font-medium">Screened at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize text-[#1A2332]">{r.screeningType?.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-[#64748B] uppercase text-xs">{r.provider}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SCREENING_COLOURS[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748B] max-w-xs truncate">{r.matchDetails ?? "—"}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDateTime(r.screenedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linked Users tab (business only)
// ---------------------------------------------------------------------------
function LinkedUsersTab({ customer }: { customer: Customer }) {
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ firstName: "", lastName: "", email: "", phone: "", role: "standard" });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/linked-users`);
    const json = await res.json();
    setLinkedUsers(Array.isArray(json) ? json : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}/linked-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add user"); return; }
    setShowForm(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", role: "standard" });
    load();
  }

  if (customer.type !== "business") {
    return <p className="text-sm text-[#64748B] py-8 text-center">Linked users are only available for business customers.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add user"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-[#E2E8F0]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v ?? "standard" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="view_only">View only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <Button className="mt-3 bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={add} disabled={saving}>
            {saving ? "Adding…" : "Add user"}
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !linkedUsers.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No linked users.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Name</TableHead>
                <TableHead className="text-[#64748B] font-medium">Email</TableHead>
                <TableHead className="text-[#64748B] font-medium">Role</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-[#1A2332]">{u.firstName} {u.lastName}</TableCell>
                  <TableCell className="text-[#64748B]">{u.email}</TableCell>
                  <TableCell className="capitalize text-[#64748B]">{u.role?.replace(/_/g, " ")}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SAR tab
// ---------------------------------------------------------------------------
function SarTab({ customer }: { customer: Customer }) {
  const [records, setRecords] = useState<SarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ type: "internal", description: "", notes: "" });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/sar`);
    const json = await res.json();
    setRecords(Array.isArray(json) ? json : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    setSaving(true);
    await fetch(`/api/customers/${customer.id}/sar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ type: "internal", description: "", notes: "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New SAR"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-[#E2E8F0]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v ?? "internal" }))}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the suspicious activity…"
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Additional notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <Button className="mt-3 bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={submit} disabled={saving || !form.description}>
            {saving ? "Saving…" : "Create SAR"}
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !records.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No SAR records for this customer.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Ref</TableHead>
                <TableHead className="text-[#64748B] font-medium">Type</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Description</TableHead>
                <TableHead className="text-[#64748B] font-medium">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm text-[#64748B]">{r.sarRef}</TableCell>
                  <TableCell className="capitalize text-[#64748B]">{r.type}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-[#64748B] max-w-xs truncate">{r.description}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDateTime(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commissions tab
// ---------------------------------------------------------------------------
function CommissionsTab({ customer }: { customer: Customer }) {
  const [records, setRecords]   = useState<Commission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ commissionType: "percentage", rate: "", currency: "", effectiveDate: "", notes: "" });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/commissions`);
    const json = await res.json();
    setRecords(Array.isArray(json) ? json : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}/commissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rate: Number(form.rate) }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    setShowForm(false);
    setForm({ commissionType: "percentage", rate: "", currency: "", effectiveDate: "", notes: "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add commission"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-[#E2E8F0]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.commissionType} onValueChange={(v) => setForm((p) => ({ ...p, commissionType: v ?? "percentage" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rate</Label>
              <Input type="number" step="0.0001" min={0} value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} />
            </div>
            {form.commissionType === "fixed" && (
              <div className="space-y-1.5">
                <Label>Currency (ISO)</Label>
                <Input maxLength={3} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Effective date</Label>
              <Input type="date" value={form.effectiveDate} onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <Button className="mt-3 bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={submit} disabled={saving || !form.rate || !form.effectiveDate}>
            {saving ? "Saving…" : "Add commission"}
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !records.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No commission records.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Type</TableHead>
                <TableHead className="text-[#64748B] font-medium">Rate</TableHead>
                <TableHead className="text-[#64748B] font-medium">Currency</TableHead>
                <TableHead className="text-[#64748B] font-medium">Effective</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="capitalize text-[#1A2332]">{c.commissionType}</TableCell>
                  <TableCell className="text-[#64748B]">{c.rate}{c.commissionType === "percentage" ? "%" : ""}</TableCell>
                  <TableCell className="text-[#64748B] uppercase">{c.currency ?? "—"}</TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(c.effectiveDate)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accounts tab
// ---------------------------------------------------------------------------
type AccountRecord = {
  id: string; accountNumber: string; accountType: string; currency: string;
  status: string; currentBalance: string; availableBalance: string; reservedBalance: string;
  openDate: string | null; closedAt: string | null; notes: string | null;
};

const ACCOUNT_STATUS_COLOURS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  active:    "bg-green-100 text-green-800",
  blocked:   "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  closed:    "bg-slate-100 text-slate-600",
};

const ACCOUNT_TRANSITIONS: Record<string, string[]> = {
  pending:   ["active", "closed"],
  active:    ["blocked", "suspended", "closed"],
  blocked:   ["active", "suspended", "closed"],
  suspended: ["active", "blocked", "closed"],
  closed:    [],
};

function AccountsTab({ customer }: { customer: Customer }) {
  const [accounts, setAccounts]   = useState<AccountRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [openDialog, setOpenDialog]   = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selected, setSelected]   = useState<AccountRecord | null>(null);
  const [form, setForm]           = useState({ currency: "", accountType: "current", notes: "" });
  const [statusForm, setStatusForm] = useState({ status: "", reason: "" });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/customers/${customer.id}/accounts`);
    const json = await res.json();
    setAccounts(Array.isArray(json) ? json : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function openAccount() {
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: form.currency.toUpperCase(), accountType: form.accountType, notes: form.notes || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to open account"); return; }
    setOpenDialog(false);
    setForm({ currency: "", accountType: "current", notes: "" });
    load();
  }

  async function changeStatus() {
    if (!selected) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}/accounts/${selected.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusForm.status, reason: statusForm.reason }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to update status"); return; }
    setStatusDialog(false);
    setStatusForm({ status: "", reason: "" });
    load();
  }

  function fmt(n: string | null) {
    if (!n) return "0.00";
    return parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
          size="sm"
          onClick={() => setOpenDialog(true)}
        >
          Open account
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No accounts.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Account number</TableHead>
                <TableHead className="text-[#64748B] font-medium">Type</TableHead>
                <TableHead className="text-[#64748B] font-medium">Currency</TableHead>
                <TableHead className="text-[#64748B] font-medium">Current balance</TableHead>
                <TableHead className="text-[#64748B] font-medium">Available</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Opened</TableHead>
                <TableHead className="text-[#64748B] font-medium w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono text-sm text-[#1A2332]">{acc.accountNumber}</TableCell>
                  <TableCell className="capitalize text-[#64748B]">{acc.accountType}</TableCell>
                  <TableCell className="uppercase font-medium text-[#1A2332]">{acc.currency}</TableCell>
                  <TableCell className="text-[#1A2332]">{fmt(acc.currentBalance)}</TableCell>
                  <TableCell className="text-[#64748B]">{fmt(acc.availableBalance)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACCOUNT_STATUS_COLOURS[acc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {acc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(acc.openDate)}</TableCell>
                  <TableCell>
                    {ACCOUNT_TRANSITIONS[acc.status]?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => { setSelected(acc); setStatusForm({ status: "", reason: "" }); setError(""); setStatusDialog(true); }}
                      >
                        Manage
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Open account dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open account</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-1.5">
              <Label>Currency <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. GBP"
                maxLength={3}
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account type</Label>
              <Select value={form.accountType} onValueChange={(v) => setForm((p) => ({ ...p, accountType: v ?? "current" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
              onClick={openAccount}
              disabled={saving || form.currency.length !== 3}
            >
              {saving ? "Opening…" : "Open account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage account — {selected?.accountNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-[#64748B]">
              Current status: <span className="font-medium capitalize">{selected?.status}</span>
            </p>
            <div className="space-y-1.5">
              <Label>New status <span className="text-red-500">*</span></Label>
              <Select value={statusForm.status || ""} onValueChange={(v) => setStatusForm((p) => ({ ...p, status: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                <SelectContent>
                  {(ACCOUNT_TRANSITIONS[selected?.status ?? ""] ?? []).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-red-500">*</span></Label>
              <Textarea
                rows={2}
                value={statusForm.reason}
                onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Reason for this status change…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button>
            <Button
              className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
              onClick={changeStatus}
              disabled={saving || !statusForm.status || !statusForm.reason}
            >
              {saving ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Beneficiaries tab
// ---------------------------------------------------------------------------
type BeneficiaryRecord = {
  id: string; displayName: string; bankName: string | null; accountNumber: string | null;
  iban: string | null; currency: string; country: string;
  status: string; flagReason: string | null; flaggedAt: string | null;
  createdAt: string;
};

const BENE_STATUS_COLOURS: Record<string, string> = {
  active:  "bg-green-100 text-green-800",
  flagged: "bg-amber-100 text-amber-800",
  blocked: "bg-red-100 text-red-800",
};

function BeneficiariesTab({ customer }: { customer: Customer }) {
  const [records, setRecords]     = useState<BeneficiaryRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionDialog, setActionDialog] = useState(false);
  const [selected, setSelected]   = useState<BeneficiaryRecord | null>(null);
  const [form, setForm]           = useState({ status: "", flagReason: "" });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/customers/${customer.id}/beneficiaries`);
    const json = await res.json();
    setRecords(Array.isArray(json) ? json : []);
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); }, [load]);

  async function applyAction() {
    if (!selected) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${customer.id}/beneficiaries/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.status, flagReason: form.flagReason || undefined }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    setActionDialog(false);
    setForm({ status: "", flagReason: "" });
    load();
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No beneficiaries.</p>
      ) : (
        <Card className="overflow-hidden border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                <TableHead className="text-[#64748B] font-medium">Name</TableHead>
                <TableHead className="text-[#64748B] font-medium">Bank</TableHead>
                <TableHead className="text-[#64748B] font-medium">Account / IBAN</TableHead>
                <TableHead className="text-[#64748B] font-medium">Currency</TableHead>
                <TableHead className="text-[#64748B] font-medium">Country</TableHead>
                <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                <TableHead className="text-[#64748B] font-medium">Added</TableHead>
                <TableHead className="text-[#64748B] font-medium w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-[#1A2332]">{b.displayName}</TableCell>
                  <TableCell className="text-[#64748B]">{b.bankName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-[#64748B]">{b.iban ?? b.accountNumber ?? "—"}</TableCell>
                  <TableCell className="uppercase font-medium text-[#1A2332]">{b.currency}</TableCell>
                  <TableCell className="uppercase text-[#64748B]">{b.country}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BENE_STATUS_COLOURS[b.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {b.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(b.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setSelected(b);
                        setForm({ status: "", flagReason: b.flagReason ?? "" });
                        setError("");
                        setActionDialog(true);
                      }}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Manage beneficiary dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage beneficiary — {selected?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-[#64748B]">
              Current status: <span className="font-medium capitalize">{selected?.status}</span>
            </p>
            <div className="space-y-1.5">
              <Label>Action <span className="text-red-500">*</span></Label>
              <Select value={form.status || ""} onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select action…" /></SelectTrigger>
                <SelectContent>
                  {selected?.status !== "active"  && <SelectItem value="active">Restore to active</SelectItem>}
                  {selected?.status !== "flagged" && <SelectItem value="flagged">Flag for review</SelectItem>}
                  {selected?.status !== "blocked" && <SelectItem value="blocked">Block</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {(form.status === "flagged" || form.status === "blocked") && (
              <div className="space-y-1.5">
                <Label>Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  rows={2}
                  value={form.flagReason}
                  onChange={(e) => setForm((p) => ({ ...p, flagReason: e.target.value }))}
                  placeholder="Reason for flagging or blocking…"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>Cancel</Button>
            <Button
              className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
              onClick={applyAction}
              disabled={saving || !form.status || ((form.status === "flagged" || form.status === "blocked") && !form.flagReason)}
            >
              {saving ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit tab
// ---------------------------------------------------------------------------
function AuditTab({ customer }: { customer: Customer }) {
  const [data, setData]   = useState<{ data: AuditLog[]; total: number; pages: number } | null>(null);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/customers/${customer.id}/audit?page=${page}&limit=20`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [customer.id, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-[#64748B] py-8 text-center">Loading…</p>
      ) : !data?.data.length ? (
        <p className="text-sm text-[#64748B] py-8 text-center">No audit records.</p>
      ) : (
        <>
          <Card className="overflow-hidden border-[#E2E8F0]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
                  <TableHead className="text-[#64748B] font-medium">Action</TableHead>
                  <TableHead className="text-[#64748B] font-medium">Actor</TableHead>
                  <TableHead className="text-[#64748B] font-medium">Changes</TableHead>
                  <TableHead className="text-[#64748B] font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-[#1A2332]">{log.action}</TableCell>
                    <TableCell className="text-[#64748B] text-sm">{log.actorEmail ?? "—"}</TableCell>
                    <TableCell className="text-[#64748B] text-xs max-w-xs truncate">
                      {log.newValue ? JSON.stringify(log.newValue).slice(0, 80) : "—"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {(data?.pages ?? 0) > 1 && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [customer, setCustomer]     = useState<Customer | null>(null);
  const [loading, setLoading]       = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [blacklistDialog, setBlacklistDialog] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "", onboardingStatus: "", reason: "" });
  const [blacklistForm, setBlacklistForm] = useState({ blacklisted: false, reason: "" });
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/customers/${id}`);
    const json = await res.json();
    setCustomer(json);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus() {
    setSaving(true);
    const payload: Record<string, string> = {};
    if (statusForm.status)          payload.status = statusForm.status;
    if (statusForm.onboardingStatus) payload.onboardingStatus = statusForm.onboardingStatus;
    if (statusForm.reason)           payload.reason = statusForm.reason;
    await fetch(`/api/customers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setStatusDialog(false);
    setStatusForm({ status: "", onboardingStatus: "", reason: "" });
    load();
  }

  async function toggleBlacklist() {
    setSaving(true);
    await fetch(`/api/customers/${id}/blacklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blacklisted: blacklistForm.blacklisted, reason: blacklistForm.reason }),
    });
    setSaving(false);
    setBlacklistDialog(false);
    setBlacklistForm({ blacklisted: false, reason: "" });
    load();
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;
  if (!customer) return <div className="py-16 text-center text-[#64748B]">Customer not found.</div>;

  const displayName = customer.type === "individual"
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || customer.customerRef
    : (customer.legalEntityName ?? customer.customerRef);

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1A2332] mb-4 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Customers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#1A2332]">{displayName}</h1>
            {customer.isBlacklisted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3" /> Blacklisted
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-[#64748B] font-mono">{customer.customerRef}</span>
            <Badge variant="outline" className="capitalize text-xs">{customer.type}</Badge>
            <StatusBadge status={customer.status} />
            <StatusBadge status={customer.onboardingStatus} />
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_COLOURS[customer.riskCategory]}`}>
              {customer.riskCategory} risk
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SCREENING_COLOURS[customer.screeningStatus]}`}>
              {customer.screeningStatus.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBlacklistForm({ blacklisted: !customer.isBlacklisted, reason: "" });
              setBlacklistDialog(true);
            }}
            className={customer.isBlacklisted ? "text-[#64748B]" : "text-red-600 border-red-200 hover:bg-red-50"}
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
            {customer.isBlacklisted ? "Remove blacklist" : "Blacklist"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusDialog(true)}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Change status
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="mb-4 bg-[#F7F9FC] border border-[#E2E8F0]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="screening">Screening</TabsTrigger>
          {customer.type === "business" && <TabsTrigger value="users">Linked users</TabsTrigger>}
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
          <TabsTrigger value="sar">SAR</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab customer={customer} onRefresh={load} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab customerId={id} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskTab customer={customer} onRefresh={load} />
        </TabsContent>
        <TabsContent value="screening">
          <ScreeningTab customer={customer} onRefresh={load} />
        </TabsContent>
        {customer.type === "business" && (
          <TabsContent value="users">
            <LinkedUsersTab customer={customer} />
          </TabsContent>
        )}
        <TabsContent value="accounts">
          <AccountsTab customer={customer} />
        </TabsContent>
        <TabsContent value="beneficiaries">
          <BeneficiariesTab customer={customer} />
        </TabsContent>
        <TabsContent value="sar">
          <SarTab customer={customer} />
        </TabsContent>
        <TabsContent value="commissions">
          <CommissionsTab customer={customer} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab customer={customer} />
        </TabsContent>
      </Tabs>

      {/* Status dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Customer status</Label>
              <Select value={statusForm.status || "none"} onValueChange={(v) => setStatusForm((p) => ({ ...p, status: (v ?? "") === "none" ? "" : (v ?? "") }))}>
                <SelectTrigger><SelectValue placeholder="No change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No change</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Onboarding status</Label>
              <Select value={statusForm.onboardingStatus || "none"} onValueChange={(v) => setStatusForm((p) => ({ ...p, onboardingStatus: (v ?? "") === "none" ? "" : (v ?? "") }))}>
                <SelectTrigger><SelectValue placeholder="No change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No change</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                value={statusForm.reason}
                onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
                rows={2}
                placeholder="Reason for this status change…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button>
            <Button
              className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
              onClick={changeStatus}
              disabled={saving || (!statusForm.status && !statusForm.onboardingStatus)}
            >
              {saving ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist dialog */}
      <Dialog open={blacklistDialog} onOpenChange={setBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customer.isBlacklisted ? "Remove blacklist flag" : "Blacklist customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!customer.isBlacklisted && (
              <>
                <p className="text-sm text-[#64748B]">
                  Blacklisting will block this customer from initiating transactions. This action is logged.
                </p>
                <div className="space-y-1.5">
                  <Label>Reason <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={blacklistForm.reason}
                    onChange={(e) => setBlacklistForm((p) => ({ ...p, reason: e.target.value }))}
                    rows={3}
                    placeholder="State the reason for blacklisting…"
                  />
                </div>
              </>
            )}
            {customer.isBlacklisted && (
              <p className="text-sm text-[#64748B]">
                This will remove the blacklist flag and allow the customer to transact again.
                {customer.blacklistReason && (
                  <span className="block mt-1">Previous reason: <em>{customer.blacklistReason}</em></span>
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistDialog(false)}>Cancel</Button>
            <Button
              className={customer.isBlacklisted ? "bg-[#1E4D8C] hover:bg-[#1a4279] text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={toggleBlacklist}
              disabled={saving || (!customer.isBlacklisted && !blacklistForm.reason)}
            >
              {saving ? "Saving…" : customer.isBlacklisted ? "Remove flag" : "Blacklist customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
