"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = {
  id: string; code: string; name: string; description: string | null; type: string; status: string;
};

const TYPE_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  mobile_money:  "Mobile money",
  cash_pickup:   "Cash pickup",
  wallet:        "Wallet",
  card:          "Card",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", type: "", status: "inactive" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/configuration/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    await fetch(`/api/configuration/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "active" ? "inactive" : "active" }),
    });
    load();
  }

  async function addProduct() {
    setSaving(true); setError(null);
    const res = await fetch("/api/configuration/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add product."); return; }
    setShowAdd(false);
    setForm({ code: "", name: "", description: "", type: "", status: "inactive" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Define the delivery methods available for sending money (e.g. bank transfer, mobile money)."
        action={
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add product
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Code</TableHead>
              <TableHead className="text-[#64748B] font-medium">Type</TableHead>
              <TableHead className="text-[#64748B] font-medium">Description</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : products.map((p) => (
              <TableRow key={p.id} className="hover:bg-[#F7F9FC]">
                <TableCell className="font-medium text-[#1A2332]">{p.name}</TableCell>
                <TableCell className="font-mono text-[#64748B]">{p.code}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs text-[#1E4D8C] border-[#1E4D8C]/30 bg-[#1E4D8C]/5">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#64748B] max-w-xs truncate">{p.description ?? "—"}</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(p.id, p.status)}>
                    <StatusBadge status={p.status} className="cursor-pointer" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input placeholder="mobile_money" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, type: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Product name</Label>
              <Input placeholder="Mobile Money" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-[#64748B]">(optional)</span></Label>
              <Textarea placeholder="Describe this product…" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={addProduct} disabled={saving || !form.code || !form.name || !form.type}>
              {saving ? "Adding…" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
