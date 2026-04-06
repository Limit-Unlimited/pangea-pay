"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Currency = {
  id: string; code: string; name: string; symbol: string; decimalPlaces: number; status: string;
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", symbol: "", decimalPlaces: 2 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/configuration/currencies");
    const data = await res.json();
    setCurrencies(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    await fetch(`/api/configuration/currencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "active" ? "inactive" : "active" }),
    });
    load();
  }

  async function addCurrency() {
    setSaving(true); setError(null);
    const res = await fetch("/api/configuration/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add currency."); return; }
    setShowAdd(false);
    setForm({ code: "", name: "", symbol: "", decimalPlaces: 2 });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Currencies"
        description="Manage the currencies supported across send and receive corridors."
        action={
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add currency
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Code</TableHead>
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Symbol</TableHead>
              <TableHead className="text-[#64748B] font-medium">Decimal places</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : currencies.map((c) => (
              <TableRow key={c.id} className="hover:bg-[#F7F9FC]">
                <TableCell className="font-mono font-semibold text-[#1A2332]">{c.code}</TableCell>
                <TableCell className="text-[#1A2332]">{c.name}</TableCell>
                <TableCell className="text-[#64748B]">{c.symbol}</TableCell>
                <TableCell className="text-[#64748B]">{c.decimalPlaces}</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(c.id, c.status)}>
                    <StatusBadge status={c.status} className="cursor-pointer" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add currency</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ISO code</Label>
                <Input placeholder="NGN" maxLength={3} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Symbol</Label>
                <Input placeholder="₦" value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Currency name</Label>
              <Input placeholder="Nigerian Naira" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Decimal places</Label>
              <Input type="number" min={0} max={8} value={form.decimalPlaces} onChange={(e) => setForm((f) => ({ ...f, decimalPlaces: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={addCurrency} disabled={saving}>
              {saving ? "Adding…" : "Add currency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
