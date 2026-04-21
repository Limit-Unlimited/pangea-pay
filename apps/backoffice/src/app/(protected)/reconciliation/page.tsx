"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, RefreshCw, ChevronRight, CheckCircle, XCircle, MinusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

type UploadRow = {
  id: string;
  uploadRef: string;
  fileName: string;
  status: string;
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  processedAt: string | null;
  createdAt: string;
};

type RecItem = {
  id: string;
  rowNumber: number;
  valueDate: string | null;
  direction: string | null;
  amount: string | null;
  currency: string | null;
  reference: string | null;
  description: string | null;
  matchStatus: string;
  matchedTransactionId: string | null;
  matchedRef: string | null;
};

type DetailResponse = { upload: UploadRow; items: RecItem[] };

const MATCH_COLOURS: Record<string, string> = {
  matched:          "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
  manually_matched: "bg-[#B0D980]/10 text-[#B0D980] border-[#B0D980]/20",
  unmatched:        "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  excluded:         "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20",
};

const MATCH_ICONS: Record<string, React.ReactNode> = {
  matched:          <CheckCircle className="h-3.5 w-3.5" />,
  manually_matched: <CheckCircle className="h-3.5 w-3.5" />,
  unmatched:        <XCircle className="h-3.5 w-3.5" />,
  excluded:         <MinusCircle className="h-3.5 w-3.5" />,
};

export default function ReconciliationPage() {
  const [uploads, setUploads]   = useState<UploadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh]   = useState(0);

  // Upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ uploadRef: string; totalRows: number; matched: number; unmatched: number } | null>(null);

  // Detail state
  const [detail, setDetail]         = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [matchFilter, setMatchFilter]   = useState("");

  // Manual match state
  const [matchItem, setMatchItem]       = useState<RecItem | null>(null);
  const [matchTxnRef, setMatchTxnRef]   = useState("");
  const [matchLoading, setMatchLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res  = await fetch("/api/reconciliation?limit=20");
    const json = await res.json();
    setUploads(json.data ?? []);
    setIsLoading(false);
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res  = await fetch("/api/reconciliation", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) { alert(json.error ?? "Upload failed"); return; }
    setUploadResult(json);
    setRefresh((n) => n + 1);

    if (fileRef.current) fileRef.current.value = "";
  }

  async function openDetail(id: string) {
    setSelectedUploadId(id);
    setDetailLoading(true);
    const res  = await fetch(`/api/reconciliation/${id}`);
    const json = await res.json();
    setDetail(json);
    setDetailLoading(false);
  }

  async function handleManualMatch() {
    if (!matchItem || !selectedUploadId) return;
    setMatchLoading(true);

    // Resolve transactionId from referenceNumber
    const txnRes  = await fetch(`/api/transactions?q=${matchTxnRef}&limit=1`);
    const txnJson = await txnRes.json();
    const txn     = txnJson.data?.[0];

    if (!txn) {
      alert("Transaction not found");
      setMatchLoading(false);
      return;
    }

    const res = await fetch(`/api/reconciliation/${selectedUploadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: matchItem.id, transactionId: txn.id }),
    });

    const json = await res.json();
    setMatchLoading(false);
    if (!res.ok) { alert(json.error ?? "Match failed"); return; }

    setMatchItem(null);
    setMatchTxnRef("");
    await openDetail(selectedUploadId);
  }

  async function handleExclude(item: RecItem) {
    if (!selectedUploadId) return;
    await fetch(`/api/reconciliation/${selectedUploadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, exclude: item.matchStatus !== "excluded" }),
    });
    await openDetail(selectedUploadId);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const filteredItems = (detail?.items ?? []).filter((i) =>
    !matchFilter || i.matchStatus === matchFilter,
  );

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Upload bank statements or partner files to auto-match and reconcile transactions."
        action={
          <Button
            className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload CSV"}
          </Button>
        }
      />
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />

      {uploadResult && (
        <div className="mb-4 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 p-4 text-sm">
          <span className="font-medium">{uploadResult.uploadRef}</span> processed —{" "}
          {uploadResult.totalRows} rows, {uploadResult.matched} matched, {uploadResult.unmatched} unmatched.
          <Button variant="link" className="text-[#4A8C1C] p-0 ml-2 h-auto" onClick={() => setUploadResult(null)}>Dismiss</Button>
        </div>
      )}

      <div className="flex gap-4">
        {/* Upload list */}
        <div className="w-80 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#1A2332]">Upload history</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRefresh((n) => n + 1)}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="space-y-1.5">
            {isLoading ? (
              <p className="text-sm text-[#64748B] py-4 text-center">Loading…</p>
            ) : !uploads.length ? (
              <p className="text-sm text-[#64748B] py-4 text-center">No uploads yet.</p>
            ) : uploads.map((u) => (
              <button
                key={u.id}
                onClick={() => openDetail(u.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedUploadId === u.id
                    ? "border-[#4A8C1C] bg-[#4A8C1C]/5"
                    : "border-[#E2E8F0] hover:border-[#4A8C1C]/50 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[#1A2332]">{u.uploadRef}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                </div>
                <p className="text-xs text-[#64748B] truncate mt-0.5">{u.fileName}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-[#22C55E]">{u.matchedRows} matched</span>
                  <span className="text-xs text-[#EF4444]">{u.unmatchedRows} unmatched</span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{formatDate(u.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {!selectedUploadId ? (
            <div className="flex items-center justify-center h-48 border border-dashed border-[#E2E8F0] rounded-lg">
              <p className="text-sm text-[#64748B]">Select an upload to view items</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-[#64748B]">Loading…</p>
            </div>
          ) : detail ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#1A2332]">{detail.upload.uploadRef} — {detail.upload.fileName}</h3>
                  <p className="text-xs text-[#64748B]">{detail.upload.totalRows} rows · uploaded {formatDate(detail.upload.createdAt)}</p>
                </div>
                <div className="flex gap-1.5">
                  {["", "matched", "manually_matched", "unmatched", "excluded"].map((s) => (
                    <Button key={s} variant={matchFilter === s ? "default" : "outline"} size="sm" className={`text-xs h-7 ${matchFilter === s ? "bg-[#4A8C1C] text-white" : ""}`}
                      onClick={() => setMatchFilter(s)}>
                      {s || "All"}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="overflow-hidden border-[#E2E8F0]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
                      <TableHead className="text-[#64748B] font-medium w-12">Row</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Date</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Reference</TableHead>
                      <TableHead className="text-[#64748B] font-medium text-right">Amount</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Status</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Matched to</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!filteredItems.length ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-[#64748B]">No items.</TableCell></TableRow>
                    ) : filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-[#F8FBEF]">
                        <TableCell className="text-xs text-[#64748B]">{item.rowNumber}</TableCell>
                        <TableCell className="text-xs text-[#64748B]">{item.valueDate ?? "—"}</TableCell>
                        <TableCell>
                          <p className="text-xs font-mono text-[#1A2332]">{item.reference ?? "—"}</p>
                          {item.description && <p className="text-xs text-[#64748B] truncate max-w-[160px]">{item.description}</p>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-mono ${item.direction === "credit" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                            {item.direction === "credit" ? "+" : "-"}{item.amount ?? "—"} {item.currency ?? ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 text-xs ${MATCH_COLOURS[item.matchStatus] ?? ""}`}>
                            {MATCH_ICONS[item.matchStatus]}
                            {item.matchStatus.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.matchedRef ? (
                            <code className="text-xs font-mono text-[#4A8C1C]">{item.matchedRef}</code>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.matchStatus === "unmatched" && (
                              <Button variant="outline" size="sm" className="text-xs h-6 px-2"
                                onClick={() => { setMatchItem(item); setMatchTxnRef(""); }}>
                                <Search className="h-3 w-3 mr-1" /> Match
                              </Button>
                            )}
                            {(item.matchStatus === "unmatched" || item.matchStatus === "excluded") && (
                              <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-[#64748B]"
                                onClick={() => handleExclude(item)}>
                                {item.matchStatus === "excluded" ? "Reinstate" : "Exclude"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      {/* Manual match dialog */}
      <Dialog open={!!matchItem} onOpenChange={(o) => { if (!o) setMatchItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Match to transaction</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {matchItem && (
              <div className="text-sm text-[#64748B] rounded-lg bg-[#F8FBEF] border border-[#E2E8F0] p-3 space-y-0.5">
                <p><span className="font-medium">Reference:</span> {matchItem.reference ?? "—"}</p>
                <p><span className="font-medium">Amount:</span> {matchItem.amount} {matchItem.currency}</p>
                <p><span className="font-medium">Date:</span> {matchItem.valueDate ?? "—"}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label>Transaction reference <span className="text-[#EF4444]">*</span></Label>
              <Input value={matchTxnRef} onChange={(e) => setMatchTxnRef(e.target.value)} placeholder="TXN-000001" />
              <p className="text-xs text-[#64748B]">Enter the Pangea transaction reference number to match against.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchItem(null)}>Cancel</Button>
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
              onClick={handleManualMatch}
              disabled={matchLoading || !matchTxnRef.trim()}>
              {matchLoading ? "Matching…" : "Confirm match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
