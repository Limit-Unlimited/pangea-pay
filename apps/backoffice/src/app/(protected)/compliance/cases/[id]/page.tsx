"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FolderOpen, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Note = {
  id: string; content: string; authorId: string | null; authorName: string | null;
  authorEmail: string | null; createdAt: string;
};

type AlertLink = {
  id: string; alertRef: string; ruleCode: string; ruleName: string;
  severity: string; status: string; createdAt: string;
};

type CaseDetail = {
  id: string; caseRef: string; title: string; description: string | null;
  status: string; priority: string; customerId: string; assignedTo: string | null;
  sarReference: string | null; sarFiledAt: string | null; dueDate: string | null;
  openedAt: string; closedAt: string | null; closureNotes: string | null;
  customer: { id: string; firstName: string | null; lastName: string | null; customerRef: string } | null;
  notes: Note[];
  alerts: AlertLink[];
  assignee: { id: string; firstName: string | null; email: string } | null;
};

const STATUS_COLOURS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800", under_investigation: "bg-amber-100 text-amber-800",
  escalated_to_sar: "bg-red-100 text-red-800", closed: "bg-slate-100 text-slate-600",
};
const PRI_COLOURS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700", medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};
const SEV_COLOURS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const ACTIONS: Record<string, { label: string; next: string; variant: "default" | "outline" | "destructive"; requiresSar?: boolean; requiresClose?: boolean }[]> = {
  open:                [
    { label: "Start investigation", next: "under_investigation", variant: "default" },
    { label: "Close case", next: "closed", variant: "outline", requiresClose: true },
    { label: "Escalate to SAR", next: "escalated_to_sar", variant: "destructive", requiresSar: true },
  ],
  under_investigation: [
    { label: "Close case", next: "closed", variant: "outline", requiresClose: true },
    { label: "Escalate to SAR", next: "escalated_to_sar", variant: "destructive", requiresSar: true },
  ],
  escalated_to_sar:    [{ label: "Close case", next: "closed", variant: "outline", requiresClose: true }],
  closed:              [],
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-sm text-[#64748B] w-40 shrink-0">{label}</span>
      <span className="text-sm text-[#1A2332] text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [caseData, setCaseData]     = useState<CaseDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refresh, setRefresh]       = useState(0);
  const [noteText, setNoteText]     = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [action, setAction]         = useState<typeof ACTIONS[string][number] | null>(null);
  const [closureNotes, setClosureNotes] = useState("");
  const [sarRef, setSarRef]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/compliance/cases/${id}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setCaseData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, refresh]);

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    await fetch(`/api/compliance/cases/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText.trim() }),
    });
    setAddingNote(false);
    setNoteText("");
    setRefresh((n) => n + 1);
  }

  async function handleAction() {
    if (!action) return;
    setSaving(true);
    setActionError("");
    const body: Record<string, string> = { status: action.next };
    if (action.requiresClose && closureNotes) body.closureNotes = closureNotes;
    if (action.requiresSar && sarRef) body.sarReference = sarRef;

    const res = await fetch(`/api/compliance/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(json.error ?? "Action failed"); return; }
    setAction(null);
    setClosureNotes("");
    setSarRef("");
    setRefresh((n) => n + 1);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;
  if (!caseData) return <p className="text-[#64748B] py-8 text-center">Case not found.</p>;

  const availableActions = ACTIONS[caseData.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 text-[#64748B]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <FolderOpen className="w-5 h-5 text-[#64748B]" />
          <h1 className="text-xl font-bold text-[#1A2332] font-mono">{caseData.caseRef}</h1>
          <Badge className={`capitalize text-xs ${STATUS_COLOURS[caseData.status]}`}>{caseData.status.replace(/_/g, " ")}</Badge>
          <Badge className={`capitalize text-xs ${PRI_COLOURS[caseData.priority]}`}>{caseData.priority} priority</Badge>
        </div>
      </div>

      <h2 className="text-base font-semibold text-[#1A2332] -mt-2">{caseData.title}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card className="p-5 border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Case details</h2>
            {caseData.description && <p className="text-sm text-[#64748B] mb-3">{caseData.description}</p>}
            <DetailRow label="Opened" value={new Date(caseData.openedAt).toLocaleString("en-GB")} />
            {caseData.dueDate && <DetailRow label="Due date" value={new Date(caseData.dueDate).toLocaleDateString("en-GB")} />}
            {caseData.assignee && <DetailRow label="Assigned to" value={caseData.assignee.firstName ?? caseData.assignee.email} />}
            {caseData.sarReference && <DetailRow label="SAR reference" value={<span className="font-mono text-xs">{caseData.sarReference}</span>} />}
            {caseData.sarFiledAt && <DetailRow label="SAR filed" value={new Date(caseData.sarFiledAt).toLocaleString("en-GB")} />}
            {caseData.closedAt && <DetailRow label="Closed" value={new Date(caseData.closedAt).toLocaleString("en-GB")} />}
            {caseData.closureNotes && <DetailRow label="Closure notes" value={caseData.closureNotes} />}
          </Card>

          {/* Linked alerts */}
          {caseData.alerts.length > 0 && (
            <Card className="p-5 border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Linked alerts ({caseData.alerts.length})</h2>
              <div className="space-y-2">
                {caseData.alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <span className="font-mono text-xs text-[#1A2332]">{a.alertRef}</span>
                      <span className="text-xs text-[#64748B] ml-2">{a.ruleName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${SEV_COLOURS[a.severity]}`}>{a.severity}</Badge>
                      <button
                        onClick={() => router.push(`/compliance/alerts/${a.id}`)}
                        className="text-[#4A8C1C] hover:text-[#3a7016]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="p-5 border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Case notes ({caseData.notes.length})</h2>
            {caseData.notes.length > 0 && (
              <div className="space-y-3 mb-4">
                {caseData.notes.map((n) => (
                  <div key={n.id} className="bg-[#F8FBEF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#1A2332]">{n.authorName ?? n.authorEmail ?? "System"}</span>
                      <span className="text-xs text-[#64748B]">{new Date(n.createdAt).toLocaleString("en-GB")}</span>
                    </div>
                    <p className="text-sm text-[#64748B] whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
            {caseData.status !== "closed" && (
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={addingNote || !noteText.trim()}
                  className="self-end bg-[#4A8C1C] hover:bg-[#3a7016] text-white h-9"
                >
                  {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Customer */}
          {caseData.customer && (
            <Card className="p-4 border-[#E2E8F0]">
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Customer</h2>
              <p className="text-sm font-medium text-[#1A2332]">
                {[caseData.customer.firstName, caseData.customer.lastName].filter(Boolean).join(" ") || "—"}
              </p>
              <button
                onClick={() => router.push(`/customers/${caseData.customer!.id}`)}
                className="text-xs text-[#4A8C1C] hover:underline flex items-center gap-1 mt-1"
              >
                {caseData.customer.customerRef} <ExternalLink className="w-3 h-3" />
              </button>
            </Card>
          )}

          {/* Actions */}
          {availableActions.length > 0 && (
            <Card className="p-4 border-[#E2E8F0]">
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Actions</h2>
              <div className="space-y-2">
                {availableActions.map((a) => (
                  <Button
                    key={a.next}
                    variant={a.variant}
                    className="w-full h-8 text-sm"
                    onClick={() => { setAction(a); setClosureNotes(""); setSarRef(""); setActionError(""); }}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={!!action} onOpenChange={() => setAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            {action?.requiresSar && (
              <div className="space-y-1.5">
                <Label>SAR reference</Label>
                <Input
                  value={sarRef}
                  onChange={(e) => setSarRef(e.target.value)}
                  placeholder="NCA/MLRO reference…"
                />
              </div>
            )}
            {action?.requiresClose && (
              <div className="space-y-1.5">
                <Label>Closure notes</Label>
                <Textarea
                  rows={3}
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Summarise the outcome and rationale for closing…"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={saving} className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
