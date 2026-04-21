"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Transaction = {
  id:                 string;
  referenceNumber:    string;
  type:               string;
  status:             string;
  sendAmount:         string;
  sendCurrency:       string;
  receiveAmount:      string | null;
  receiveCurrency:    string | null;
  fxRate:             string | null;
  fee:                string;
  feeCurrency:        string;
  payoutMethod:       string | null;
  customerRef:        string | null;
  providerRef:        string | null;
  holdReason:         string | null;
  failureReason:      string | null;
  cancellationReason: string | null;
  createdAt:          string;
  completedAt:        string | null;
  failedAt:           string | null;
  cancelledAt:        string | null;
};

type HistoryEntry = {
  id:         string;
  fromStatus: string | null;
  toStatus:   string;
  reason:     string | null;
  createdAt:  string;
};

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  initiated:  { label: "Initiated",    colour: "bg-slate-100 text-slate-600" },
  pending:    { label: "Pending",      colour: "bg-amber-100 text-amber-700" },
  processing: { label: "Processing",   colour: "bg-blue-100 text-blue-700" },
  on_hold:    { label: "Under review", colour: "bg-orange-100 text-orange-700" },
  completed:  { label: "Completed",    colour: "bg-green-100 text-green-700" },
  failed:     { label: "Failed",       colour: "bg-red-100 text-red-700" },
  cancelled:  { label: "Cancelled",    colour: "bg-slate-100 text-slate-500" },
  refunded:   { label: "Refunded",     colour: "bg-purple-100 text-purple-700" },
};

function fmt(n: string | null, currency?: string | null) {
  if (!n) return "—";
  return `${currency ?? ""} ${parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-[#E2E8F0] last:border-0">
      <span className="text-sm text-[#64748B] shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right text-[#1A2332] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const [txn, setTxn]           = useState<Transaction | null>(null);
  const [history, setHistory]   = useState<HistoryEntry[]>([]);
  const [beneficiary, setBenef] = useState<{ displayName: string; bankName: string | null } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setTxn(json.txn);
        setHistory(json.history ?? []);
        setBenef(json.beneficiary ?? null);
      })
      .catch(() => setError("Failed to load transaction"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;

  if (error || !txn) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-[#64748B]">{error || "Transaction not found."}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/transactions")}>Back</Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[txn.status] ?? { label: txn.status, colour: "bg-slate-100 text-slate-600" };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/transactions")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#1A2332] font-mono">{txn.referenceNumber}</h1>
          <p className="text-sm text-[#64748B] capitalize">{txn.type} · {formatDate(txn.createdAt)}</p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${statusInfo.colour}`}>
        <span className="text-sm font-semibold">{statusInfo.label}</span>
        {txn.status === "on_hold" && txn.holdReason && (
          <span className="text-xs">{txn.holdReason}</span>
        )}
        {txn.status === "failed" && txn.failureReason && (
          <span className="text-xs">{txn.failureReason}</span>
        )}
      </div>

      {/* Details */}
      <Card className="p-5 border-[#E2E8F0] bg-white">
        <h2 className="text-sm font-semibold text-[#1A2332] mb-2">Payment details</h2>
        <Row label="Amount sent"    value={fmt(txn.sendAmount, txn.sendCurrency)} mono />
        <Row label="Fee"            value={fmt(txn.fee, txn.feeCurrency)} mono />
        {txn.fxRate && txn.receiveCurrency && (
          <Row label="Exchange rate" value={`1 ${txn.sendCurrency} = ${parseFloat(txn.fxRate).toFixed(4)} ${txn.receiveCurrency}`} mono />
        )}
        {txn.receiveAmount && (
          <Row label="Amount received" value={fmt(txn.receiveAmount, txn.receiveCurrency)} mono />
        )}
        {beneficiary && (
          <Row label="Recipient" value={
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {beneficiary.displayName}{beneficiary.bankName ? ` · ${beneficiary.bankName}` : ""}
            </span>
          } />
        )}
        {txn.payoutMethod && <Row label="Method" value={txn.payoutMethod.replace("_", " ")} />}
        {txn.customerRef  && <Row label="Your reference" value={txn.customerRef} />}
        {txn.completedAt  && <Row label="Completed"      value={formatDate(txn.completedAt)} />}
        {txn.cancelledAt  && <Row label="Cancelled"      value={formatDate(txn.cancelledAt)} />}
        {txn.cancellationReason && <Row label="Cancellation reason" value={txn.cancellationReason} />}
      </Card>

      {/* Status timeline */}
      {history.length > 0 && (
        <Card className="p-5 border-[#E2E8F0] bg-white">
          <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Status history</h2>
          <div className="space-y-0">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#4A8C1C] mt-1.5 shrink-0" />
                  {i < history.length - 1 && <div className="w-px flex-1 bg-[#E2E8F0] my-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.fromStatus && (
                      <>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_LABELS[h.fromStatus]?.colour ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[h.fromStatus]?.label ?? h.fromStatus}
                        </span>
                        <span className="text-xs text-[#64748B]">→</span>
                      </>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_LABELS[h.toStatus]?.colour ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[h.toStatus]?.label ?? h.toStatus}
                    </span>
                  </div>
                  {h.reason && <p className="text-xs text-[#64748B] mt-1">{h.reason}</p>}
                  <p className="text-xs text-[#64748B] mt-0.5">{formatDate(h.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
