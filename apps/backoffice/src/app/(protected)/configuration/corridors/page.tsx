"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Corridor = {
  id: string;
  sendCountryCode: string; receiveCountryCode: string;
  sendCurrencyCode: string; receiveCurrencyCode: string;
  minSendAmount: string; maxSendAmount: string; status: string;
};

type Country = { id: string; code: string; name: string };
type Currency = { id: string; code: string; name: string };

export default function CorridorsPage() {
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ sendCountryCode: "", receiveCountryCode: "", sendCurrencyCode: "", receiveCurrencyCode: "", minSendAmount: "1", maxSendAmount: "5000" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const [corridorRes, countryRes, currencyRes] = await Promise.all([
      fetch("/api/configuration/corridors"),
      fetch("/api/configuration/countries"),
      fetch("/api/configuration/currencies"),
    ]);
    setCorridors(await corridorRes.json());
    setCountries(await countryRes.json());
    setCurrencies(await currencyRes.json());
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    await fetch(`/api/configuration/corridors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "active" ? "inactive" : "active" }),
    });
    load();
  }

  async function addCorridor() {
    setSaving(true); setError(null);
    const res = await fetch("/api/configuration/corridors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, minSendAmount: Number(form.minSendAmount), maxSendAmount: Number(form.maxSendAmount) }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add corridor."); return; }
    setShowAdd(false);
    load();
  }

  function countryName(code: string) {
    return countries.find((c) => c.code === code)?.name ?? code;
  }

  return (
    <div>
      <PageHeader
        title="Corridors"
        description="Define which send → receive country and currency pairs are operational."
        action={
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add corridor
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Route</TableHead>
              <TableHead className="text-[#64748B] font-medium">Currencies</TableHead>
              <TableHead className="text-[#64748B] font-medium">Min send</TableHead>
              <TableHead className="text-[#64748B] font-medium">Max send</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : !corridors.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-[#64748B]">No corridors configured.</TableCell></TableRow>
            ) : corridors.map((c) => (
              <TableRow key={c.id} className="hover:bg-[#F7F9FC]">
                <TableCell>
                  <div className="flex items-center gap-2 font-medium text-[#1A2332]">
                    <span>{countryName(c.sendCountryCode)} ({c.sendCountryCode})</span>
                    <ArrowRight className="h-4 w-4 text-[#64748B]" />
                    <span>{countryName(c.receiveCountryCode)} ({c.receiveCountryCode})</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[#64748B]">{c.sendCurrencyCode} → {c.receiveCurrencyCode}</TableCell>
                <TableCell className="text-[#64748B]">{c.sendCurrencyCode} {Number(c.minSendAmount).toLocaleString()}</TableCell>
                <TableCell className="text-[#64748B]">{c.sendCurrencyCode} {Number(c.maxSendAmount).toLocaleString()}</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add corridor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Send country</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, sendCountryCode: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Receive country</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, receiveCountryCode: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Send currency</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, sendCurrencyCode: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Receive currency</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, receiveCurrencyCode: v as string }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Min send amount</Label>
                <Input type="number" min={0} value={form.minSendAmount} onChange={(e) => setForm((f) => ({ ...f, minSendAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max send amount</Label>
                <Input type="number" min={0} value={form.maxSendAmount} onChange={(e) => setForm((f) => ({ ...f, maxSendAmount: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={addCorridor} disabled={saving}>
              {saving ? "Adding…" : "Add corridor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
