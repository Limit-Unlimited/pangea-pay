"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PricingRule = {
  id: string; corridorId: string; productId: string;
  feeType: string; feeValue: string; fxMarkupPercent: string;
  minFee: string | null; maxFee: string | null; status: string;
};
type Corridor = { id: string; sendCountryCode: string; receiveCountryCode: string; sendCurrencyCode: string; receiveCurrencyCode: string };
type Product  = { id: string; name: string; code: string };

const FEE_TYPE_LABELS: Record<string, string> = { flat: "Flat", percentage: "Percentage", tiered: "Tiered" };

export default function PricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ corridorId: "", productId: "", feeType: "flat", feeValue: "0", fxMarkupPercent: "0", minFee: "", maxFee: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const [rulesRes, corridorRes, productRes] = await Promise.all([
      fetch("/api/configuration/pricing"),
      fetch("/api/configuration/corridors"),
      fetch("/api/configuration/products"),
    ]);
    setRules(await rulesRes.json());
    setCorridors(await corridorRes.json());
    setProducts(await productRes.json());
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    await fetch(`/api/configuration/pricing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "active" ? "inactive" : "active" }),
    });
    load();
  }

  async function addRule() {
    setSaving(true); setError(null);
    const payload = {
      ...form,
      feeValue:        Number(form.feeValue),
      fxMarkupPercent: Number(form.fxMarkupPercent),
      minFee:          form.minFee ? Number(form.minFee) : null,
      maxFee:          form.maxFee ? Number(form.maxFee) : null,
    };
    const res = await fetch("/api/configuration/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add rule."); return; }
    setShowAdd(false);
    load();
  }

  function corridorLabel(corridorId: string) {
    const c = corridors.find((x) => x.id === corridorId);
    return c ? `${c.sendCountryCode} → ${c.receiveCountryCode} (${c.sendCurrencyCode}/${c.receiveCurrencyCode})` : corridorId;
  }

  function productLabel(productId: string) {
    return products.find((p) => p.id === productId)?.name ?? productId;
  }

  function feeDisplay(rule: PricingRule) {
    if (rule.feeType === "flat") return `${Number(rule.feeValue).toFixed(2)} flat`;
    if (rule.feeType === "percentage") return `${Number(rule.feeValue).toFixed(2)}%`;
    return "Tiered";
  }

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Configure fees and FX markup per corridor and product."
        action={
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add pricing rule
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Corridor</TableHead>
              <TableHead className="text-[#64748B] font-medium">Product</TableHead>
              <TableHead className="text-[#64748B] font-medium">Fee</TableHead>
              <TableHead className="text-[#64748B] font-medium">FX markup</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : !rules.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">No pricing rules configured.</TableCell></TableRow>
            ) : rules.map((rule) => (
              <TableRow key={rule.id} className="hover:bg-[#F7F9FC]">
                <TableCell className="font-medium text-[#1A2332] font-mono text-sm">{corridorLabel(rule.corridorId)}</TableCell>
                <TableCell className="text-[#64748B]">{productLabel(rule.productId)}</TableCell>
                <TableCell className="text-[#64748B]">{feeDisplay(rule)}</TableCell>
                <TableCell className="text-[#64748B]">{Number(rule.fxMarkupPercent).toFixed(2)}%</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(rule.id, rule.status)}>
                    <StatusBadge status={rule.status} className="cursor-pointer" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add pricing rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1.5">
              <Label>Corridor</Label>
              <Select onValueChange={(v) => setForm((f) => ({ ...f, corridorId: v as string }))}>
                <SelectTrigger><SelectValue placeholder="Select corridor…" /></SelectTrigger>
                <SelectContent>{corridors.map((c) => <SelectItem key={c.id} value={c.id}>{c.sendCountryCode} → {c.receiveCountryCode} ({c.sendCurrencyCode}/{c.receiveCurrencyCode})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select onValueChange={(v) => setForm((f) => ({ ...f, productId: v as string }))}>
                <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fee type</Label>
                <Select defaultValue="flat" onValueChange={(v) => setForm((f) => ({ ...f, feeType: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fee value</Label>
                <Input type="number" min={0} step="0.01" value={form.feeValue} onChange={(e) => setForm((f) => ({ ...f, feeValue: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>FX markup %</Label>
                <Input type="number" min={0} max={100} step="0.01" value={form.fxMarkupPercent} onChange={(e) => setForm((f) => ({ ...f, fxMarkupPercent: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Min fee <span className="text-[#64748B]">(optional)</span></Label>
                <Input type="number" min={0} step="0.01" placeholder="—" value={form.minFee} onChange={(e) => setForm((f) => ({ ...f, minFee: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={addRule} disabled={saving || !form.corridorId || !form.productId}>
              {saving ? "Adding…" : "Add rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
