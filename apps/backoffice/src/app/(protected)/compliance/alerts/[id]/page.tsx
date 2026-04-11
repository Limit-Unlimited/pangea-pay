"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldAlert, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type AlertDetail = {
  id:             string;
  alertRef:       string;
  ruleCode:       string;
  ruleName:       string;
  severity:       string;
  status:         string;
  triggerDetails: string | null;
  reviewNotes:    string | null;
  caseId:         string | null;
  createdAt:      string;
  reviewedAt:     string | null;
  customer:       { id: string; firstName: string | null; lastName: string | null; customerRef: string } | null;
  transaction:    { id: string; referenceNumber: string; type: string; status: string; sendAmount: string; sendCurrency: string } | null;
};

const SEV_COLOURS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};
const STATUS_COLOURS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800", under_review: "bg-amber-100 text-amber-800",
  cleared: "bg-green-100 text-green-800", escalated: "bg-orange-100 text-orange-800",
  closed: "bg-slate-100 text-slate-600",
};

const ACTIONS: Record<string, { label: string; next: string; variant: "default" | "outline" | "destructive" }[]> = {
  open:         [{ label: "Start review", next: "under_review", variant: "default" }, { label: "Clear", next: "cleared", variant: "outline" }],
  under_review: [{ label: "Clear alert", next: "cleared", variant: "outline" }, { label: "Escalate", next: "escalated", variant: "destructive" }],
  escalated:    [{ label: "Resume review", next: "under_review", variant: "outline" }, { label: "Close", next: "closed", variant: "default" }],
  cleared:      [{ label: "Close", next: "closed", variant: "default" }],
  closed:       [],
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-sm text-[#64748B] w-40 shrink-0">{label}</span>
      <span className="text-sm text-[#1A2332] text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [alert, setAlert]         = useState<AlertDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refresh, setRefresh]     = useState(0);
  const [action, setAction]       = useState<{ label: string; next: string; variant: string } | null>(null);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/compliance/alerts/${id}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setAlert(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, refresh]);

  async function handleAction() {
    if (!action) return;
    setSaving(true);
    setActionError("");
    const res = await fetch(`/api/compliance/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action.next, reviewNotes: notes || undefined }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(json.error ?? "Action failed"); return; }
    setAction(null);
    setNotes("");
    setRefresh((n) => n + 1);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;
  if (!alert)  return <p className="text-[#64748B] py-8 text-center">Alert not found.</p>;

  const availableActions = ACTIONS[alert.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 text-[#64748B]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#64748B]" />
          <h1 className="text-xl font-bold text-[#1A2332] font-mono">{alert.alertRef}</h1>
          <Badge className={`capitalize text-xs ${STATUS_COLOURS[alert.status]}`}>{alert.status.replace("_", " ")}</Badge>
          <Badge className={`capitalize text-xs ${SEV_COLOURS[alert.severity]}`}>{alert.severity}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Alert details</h2>
            <DetailRow label="Rule code" value={<span className="font-mono text-xs">{alert.ruleCode}</span>} />
            <DetailRow label="Rule name" value={alert.ruleName} />
            <DetailRow label="Created" value={new Date(alert.createdAt).toLocaleString("en-GB")} />
            {alert.reviewedAt && <DetailRow label="Reviewed" value={new Date(alert.reviewedAt).toLocaleString("en-GB")} />}
            {alert.caseId && <DetailRow label="Linked case" value={
              <button
                onClick={() => router.push(`/compliance/cases/${alert.caseId}`)}
                className="text-[#1E4D8C] hover:underline flex items-center gap-1"
              >
                View case <ExternalLink className="w-3 h-3" />
              </button>
            } />}
          </Card>

          {alert.triggerDetails && (
            <Card className="p-5 border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#1A2332] mb-3">Trigger data</h2>
              <pre className="text-xs text-[#64748B] bg-[#F7F9FC] rounded p-3 overflow-auto whitespace-pre-wrap">
                {(() => {
                  try { return JSON.stringify(JSON.parse(alert.triggerDetails!), null, 2); }
                  catch { return alert.triggerDetails; }
                })()}
              </pre>
            </Card>
          )}

          {alert.reviewNotes && (
            <Card className="p-5 border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#1A2332] mb-2">Review notes</h2>
              <p className="text-sm text-[#64748B]">{alert.reviewNotes}</p>
            </Card>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Customer */}
          {alert.customer && (
            <Card className="p-4 border-[#E2E8F0]">
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Customer</h2>
              <p className="text-sm font-medium text-[#1A2332]">
                {[alert.customer.firstName, alert.customer.lastName].filter(Boolean).join(" ") || "—"}
              </p>
              <button
                onClick={() => router.push(`/customers/${alert.customer!.id}`)}
                className="text-xs text-[#1E4D8C] hover:underline flex items-center gap-1 mt-1"
              >
                {alert.customer.customerRef} <ExternalLink className="w-3 h-3" />
              </button>
            </Card>
          )}

          {/* Linked transaction */}
          {alert.transaction && (
            <Card className="p-4 border-[#E2E8F0]">
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Transaction</h2>
              <p className="font-mono text-xs text-[#1A2332]">{alert.transaction.referenceNumber}</p>
              <p className="text-xs text-[#64748B] capitalize mt-0.5">{alert.transaction.type} · {alert.transaction.status}</p>
              <p className="text-sm font-medium text-[#1A2332] mt-1">
                {alert.transaction.sendCurrency} {parseFloat(alert.transaction.sendAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </p>
              <button
                onClick={() => router.push(`/payments/${alert.transaction!.id}`)}
                className="text-xs text-[#1E4D8C] hover:underline flex items-center gap-1 mt-1"
              >
                View transaction <ExternalLink className="w-3 h-3" />
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
                    variant={a.variant as "default" | "outline" | "destructive"}
                    className="w-full h-8 text-sm"
                    onClick={() => { setAction(a); setNotes(""); setActionError(""); }}
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
            <div className="space-y-1.5">
              <Label>Review notes (optional)</Label>
              <Textarea
                rows={3}
                placeholder="Add any notes about this decision…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={saving} className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
