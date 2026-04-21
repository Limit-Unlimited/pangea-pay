"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RotateCcw, Loader2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

type Transaction = {
  id:              string;
  referenceNumber: string;
  type:            string;
  status:          string;
  sendAmount:      string;
  sendCurrency:    string;
  receiveAmount:   string | null;
  receiveCurrency: string | null;
  fee:             string;
  feeCurrency:     string;
  createdAt:       string;
  completedAt:     string | null;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  send:    <ArrowUpRight   className="w-4 h-4 text-blue-600" />,
  receive: <ArrowDownLeft  className="w-4 h-4 text-green-600" />,
  convert: <ArrowLeftRight className="w-4 h-4 text-purple-600" />,
  refund:  <RotateCcw      className="w-4 h-4 text-amber-600" />,
};

const STATUS_COLOURS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  on_hold:    "bg-orange-100 text-orange-700",
  completed:  "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-700",
  cancelled:  "bg-slate-100 text-slate-500",
  refunded:   "bg-purple-100 text-purple-700",
  initiated:  "bg-slate-100 text-slate-600",
};

function fmt(n: string, currency: string) {
  return `${currency} ${parseFloat(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TransactionsPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">Transactions</h1>
        <p className="text-[#64748B] mt-1 text-sm">Your payment and transfer history.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-8 border-[#E2E8F0] bg-white text-center">
          <Clock className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#1A2332] font-medium mb-1">No transactions yet</p>
          <p className="text-sm text-[#64748B]">Your payments and transfers will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((txn) => (
            <button
              key={txn.id}
              onClick={() => router.push(`/transactions/${txn.id}`)}
              className="w-full text-left"
            >
              <Card className="p-4 border-[#E2E8F0] bg-white hover:border-[#4A8C1C]/40 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F8FBEF] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    {TYPE_ICON[txn.type] ?? <ArrowUpRight className="w-4 h-4 text-[#64748B]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1A2332] capitalize">{txn.type}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLOURS[txn.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {txn.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] font-mono mt-0.5">{txn.referenceNumber}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#1A2332]">
                      {fmt(txn.sendAmount, txn.sendCurrency)}
                    </p>
                    {txn.receiveAmount && txn.receiveCurrency && txn.receiveCurrency !== txn.sendCurrency && (
                      <p className="text-xs text-[#64748B]">→ {fmt(txn.receiveAmount, txn.receiveCurrency)}</p>
                    )}
                    <p className="text-xs text-[#64748B] mt-0.5">{formatDate(txn.createdAt)}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
