"use client";

import { useEffect, useState } from "react";
import { Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Country = {
  id: string; code: string; name: string; dialCode: string | null;
  currencyCode: string | null; isSendEnabled: boolean; isReceiveEnabled: boolean; status: string;
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", dialCode: "", currencyCode: "", status: "inactive" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/configuration/countries");
    const data = await res.json();
    setCountries(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleField(id: string, field: "isSendEnabled" | "isReceiveEnabled" | "status", current: boolean | string) {
    const value = typeof current === "boolean" ? !current : current === "active" ? "inactive" : "active";
    await fetch(`/api/configuration/countries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    load();
  }

  async function addCountry() {
    setSaving(true); setError(null);
    const res = await fetch("/api/configuration/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Failed to add country."); return; }
    setShowAdd(false);
    setForm({ code: "", name: "", dialCode: "", currencyCode: "", status: "inactive" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Countries"
        description="Configure which countries are enabled for sending and receiving."
        action={
          <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add country
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
              <TableHead className="text-[#64748B] font-medium">Country</TableHead>
              <TableHead className="text-[#64748B] font-medium">Code</TableHead>
              <TableHead className="text-[#64748B] font-medium">Currency</TableHead>
              <TableHead className="text-[#64748B] font-medium">Dial code</TableHead>
              <TableHead className="text-[#64748B] font-medium text-center">Send</TableHead>
              <TableHead className="text-[#64748B] font-medium text-center">Receive</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : countries.map((c) => (
              <TableRow key={c.id} className="hover:bg-[#F8FBEF]">
                <TableCell className="font-medium text-[#1A2332]">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#64748B]" />
                    {c.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[#64748B]">{c.code}</TableCell>
                <TableCell className="font-mono text-[#64748B]">{c.currencyCode ?? "—"}</TableCell>
                <TableCell className="text-[#64748B]">{c.dialCode ?? "—"}</TableCell>
                <TableCell className="text-center">
                  <Switch checked={c.isSendEnabled} onCheckedChange={() => toggleField(c.id, "isSendEnabled", c.isSendEnabled)} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={c.isReceiveEnabled} onCheckedChange={() => toggleField(c.id, "isReceiveEnabled", c.isReceiveEnabled)} />
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleField(c.id, "status", c.status)}>
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
          <DialogHeader><DialogTitle>Add country</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ISO code (2 letters)</Label>
                <Input placeholder="GB" maxLength={2} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Dial code</Label>
                <Input placeholder="+44" value={form.dialCode} onChange={(e) => setForm((f) => ({ ...f, dialCode: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Country name</Label>
              <Input placeholder="United Kingdom" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Default currency code</Label>
              <Input placeholder="GBP" maxLength={3} value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" onClick={addCountry} disabled={saving}>
              {saving ? "Adding…" : "Add country"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
