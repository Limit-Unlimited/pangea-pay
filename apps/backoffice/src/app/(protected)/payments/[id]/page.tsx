"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PauseCircle, PlayCircle, XCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Transaction = {
  id:                  string;
  referenceNumber:     string;
  customerId:          string;
  type:                string;
  status:              string;
  sendAmount:          string;
  sendCurrency:        string;
  receiveAmount:       string | null;
  receiveCurrency:     string | null;
  fxRate:              string | null;
  fee:                 string;
  feeCurrency:         string;
  payoutMethod:        string | null;
  purposeCode:         string | null;
  customerRef:         string | null;
  providerRef:         string | null;
  providerName:        string;
  holdReason:          string | null;
  heldAt:              string | null;
  failureReason:       string | null;
  cancellationReason:  string | null;
  notes:               string | null;
  createdAt:           string;
  completedAt:         string | null;
  failedAt:            string | null;
  cancelledAt:         string | null;
};

type HistoryEntry = {
  id:          string;
  fromStatus:  string | null;
  toStatus:    string;
  reason:      string | null;
  performedBy: string | null;
  createdAt:   string;
  actorName:   string | null;
};

type CustomerInfo = { firstName: string | null; lastName: string | null; customerRef: string | null; id: string } | null;

type Action = "hold" | "release" | "cancel" | "complete" | "fail" | "process";

const ACTION_CONFIG: Record<Action, { label: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline"; colour: string; requiresReason: boolean }> = {
  hold:    { label: "Place on hold",    icon: <PauseCircle  className="w-4 h-4" />, variant: "outline",     colour: "text-amber-600",  requiresReason: true  },
  release: { label: "Release hold",     icon: <PlayCircle   className="w-4 h-4" />, variant: "outline",     colour: "text-green-600",  requiresReason: true  },
  cancel:  { label: "Cancel",           icon: <XCircle      className="w-4 h-4" />, variant: "destructive", colour: "text-red-600",    requiresReason: true  },
  complete: { label: "Mark complete",   icon: <CheckCircle  className="w-4 h-4" />, variant: "default",     colour: "text-green-600",  requiresReason: false },
  fail:    { label: "Mark failed",      icon: <AlertTriangle className="w-4 h-4"/>, variant: "destructive", colour: "text-red-600",    requiresReason: true  },
  process: { label: "Mark processing",  icon: <PlayCircle   className="w-4 h-4" />, variant: "outline",     colour: "text-blue-600",   requiresReason: false },
};

const AVAILABLE_ACTIONS: Record<string, Action[]> = {
  initiated:  ["process", "hold", "cancel"],
  pending:    ["process", "hold", "cancel", "complete", "fail"],
  processing: ["hold", "complete", "fail"],
  on_hold:    ["release", "cancel"],
  completed:  [],
  failed:     [],
  cancelled:  [],
  refunded:   [],
};

function fmt(n: string | null, currency?: string | null) {
  if (!n) return "—";
  return `${currency ?? ""} ${parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-44">{label}</span>
      <span className={`text-sm text-right ${mono ? "font-mono" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [txn, setTxn]           = useState<Transaction | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo>(null);
  const [history, setHistory]   = useState<HistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [reason, setReason]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [actionError, setActionError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/transactions/${id}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to load transaction"); return; }
    setTxn(json.txn);
    setCustomer(json.customer ?? null);
    setHistory(json.history ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleAction() {
    if (!activeAction || !txn) return;
    const cfg = ACTION_CONFIG[activeAction];
    if (cfg.requiresReason && !reason.trim()) { setActionError("Please enter a reason."); return; }

    setSubmitting(true);
    setActionError("");

    const res  = await fetch(`/api/transactions/${id}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: activeAction, reason: reason.trim() || `Manually ${activeAction}d by operations` }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) { setActionError(json.error ?? "Action failed"); return; }

    setActiveAction(null);
    setReason("");
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">{error || "Transaction not found."}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/payments")}>Back to payments</Button>
      </div>
    );
  }

  const availableActions = AVAILABLE_ACTIONS[txn.status] ?? [];

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={txn.referenceNumber}
          description={`${txn.type.charAt(0).toUpperCase() + txn.type.slice(1)} transaction`}
          breadcrumbs={[{ label: "Payments", href: "/payments" }, { label: txn.referenceNumber }]}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/payments")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {availableActions.map((action) => {
              const cfg = ACTION_CONFIG[action];
              return (
                <Button
                  key={action}
                  variant={cfg.variant}
                  size="sm"
                  onClick={() => { setActiveAction(action); setReason(""); setActionError(""); }}
                >
                  <span className={cfg.colour}>{cfg.icon}</span>
                  <span className="ml-1.5">{cfg.label}</span>
                </Button>
              );
            })}
          </div>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction summary */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground mb-3">Transaction details</h2>
              <DetailRow label="Status"       value={<StatusBadge status={txn.status} />} />
              <DetailRow label="Type"         value={<span className="capitalize">{txn.type}</span>} />
              <DetailRow label="Reference"    value={txn.referenceNumber} mono />
              <DetailRow label="Provider ref" value={txn.providerRef ?? "—"} mono />
              <DetailRow label="Provider"     value={txn.providerName} />
              <DetailRow label="Send amount"  value={fmt(txn.sendAmount, txn.sendCurrency)} mono />
              {txn.receiveAmount && (
                <DetailRow label="Receive amount" value={fmt(txn.receiveAmount, txn.receiveCurrency)} mono />
              )}
              {txn.fxRate && (
                <DetailRow label="FX rate" value={`1 ${txn.sendCurrency} = ${parseFloat(txn.fxRate).toFixed(4)} ${txn.receiveCurrency}`} mono />
              )}
              <DetailRow label="Fee"          value={fmt(txn.fee, txn.feeCurrency)} mono />
              {txn.payoutMethod  && <DetailRow label="Payout method"  value={txn.payoutMethod} />}
              {txn.purposeCode   && <DetailRow label="Purpose"        value={txn.purposeCode} />}
              {txn.customerRef   && <DetailRow label="Customer ref"   value={txn.customerRef} mono />}
              <DetailRow label="Created"      value={formatDate(txn.createdAt)} />
              {txn.completedAt   && <DetailRow label="Completed"      value={formatDate(txn.completedAt)} />}
              {txn.failedAt      && <DetailRow label="Failed"         value={formatDate(txn.failedAt)} />}
              {txn.cancelledAt   && <DetailRow label="Cancelled"      value={formatDate(txn.cancelledAt)} />}
              {txn.failureReason && (
                <DetailRow label="Failure reason" value={<span className="text-red-600">{txn.failureReason}</span>} />
              )}
              {txn.cancellationReason && (
                <DetailRow label="Cancellation reason" value={txn.cancellationReason} />
              )}
              {txn.holdReason && (
                <DetailRow label="Hold reason" value={<span className="text-amber-600">{txn.holdReason}</span>} />
              )}
              {txn.notes && <DetailRow label="Notes" value={txn.notes} />}
            </Card>

            {/* Status history */}
            <Card className="p-5 border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground mb-3">Status history</h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status changes recorded.</p>
              ) : (
                <div className="space-y-0">
                  {history.map((h, i) => (
                    <div key={h.id} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {h.fromStatus && (
                            <>
                              <StatusBadge status={h.fromStatus} />
                              <span className="text-xs text-muted-foreground">→</span>
                            </>
                          )}
                          <StatusBadge status={h.toStatus} />
                        </div>
                        {h.reason && <p className="text-xs text-muted-foreground mt-1">{h.reason}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.actorName ?? "System"} · {formatDate(h.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Customer panel */}
          <div className="space-y-4">
            <Card className="p-5 border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground mb-3">Customer</h2>
              {customer ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{customer.customerRef}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    View customer profile
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Customer not found.</p>
              )}
            </Card>

            {txn.status === "on_hold" && txn.holdReason && (
              <Card className="p-5 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-2">
                  <PauseCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Transaction on hold</p>
                    <p className="text-xs text-amber-700 mt-1">{txn.holdReason}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Action dialog */}
      {activeAction && (
        <Dialog open onOpenChange={() => setActiveAction(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{ACTION_CONFIG[activeAction].label}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="reason">
                  Reason {ACTION_CONFIG[activeAction].requiresReason ? <span className="text-red-500">*</span> : "(optional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action…"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveAction(null)}>Cancel</Button>
              <Button
                onClick={handleAction}
                disabled={submitting}
                variant={ACTION_CONFIG[activeAction].variant}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : ACTION_CONFIG[activeAction].label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
