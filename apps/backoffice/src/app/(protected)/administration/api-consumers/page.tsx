"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Copy, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

type Consumer = {
  id: string;
  consumerRef: string;
  name: string;
  description: string | null;
  clientId: string;
  status: string;
  scopes: string;
  rateLimitPerMin: number;
  webhookUrl: string | null;
  environment: string;
  lastUsedAt: string | null;
  createdAt: string;
};

type CreatedConsumer = Consumer & { clientSecret?: string; webhookSecret?: string; message?: string };

type ListResponse = { data: Consumer[]; total: number; page: number; pages: number; limit: number };

const STATUS_COLOURS: Record<string, string> = {
  active:    "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
  suspended: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  revoked:   "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
};

const ENV_COLOURS: Record<string, string> = {
  sandbox:    "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20",
  production: "bg-[#1E4D8C]/10 text-[#1E4D8C] border-[#1E4D8C]/20",
};

function SecretReveal({ value }: { value: string }) {
  const [visible, setVisible]   = useState(false);
  const [copied, setCopied]     = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <code className="flex-1 text-xs bg-[#F7F9FC] border border-[#E2E8F0] rounded px-2 py-1 break-all font-mono">
        {visible ? value : "•".repeat(Math.min(value.length, 48))}
      </code>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setVisible((v) => !v)}>
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy}>
        {copied ? <CheckCircle className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function ApiConsumersPage() {
  const [data, setData]                 = useState<ListResponse | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [envFilter, setEnvFilter]       = useState("");
  const [page, setPage]                 = useState(1);
  const [refresh, setRefresh]           = useState(0);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", description: "", scopes: "quotes:read payments:write payments:read customers:read beneficiaries:read beneficiaries:write",
    rateLimitPerMin: 60, webhookUrl: "", environment: "sandbox",
  });
  const [created, setCreated] = useState<CreatedConsumer | null>(null);

  // Action dialog (suspend/reactivate/revoke/regen secret)
  const [actionConsumer, setActionConsumer] = useState<Consumer | null>(null);
  const [actionType, setActionType]         = useState<"suspend" | "activate" | "revoke" | "regen" | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [regenResult, setRegenResult]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (statusFilter) params.set("status", statusFilter);
    if (envFilter)    params.set("environment", envFilter);
    const res  = await fetch(`/api/api-consumers?${params}`);
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  }, [page, statusFilter, envFilter, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setCreating(true);
    const res  = await fetch("/api/api-consumers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        rateLimitPerMin: Number(createForm.rateLimitPerMin),
        webhookUrl: createForm.webhookUrl || null,
      }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) { alert(json.error ?? "Failed to create consumer"); return; }
    setCreated(json);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreated(null);
    setCreateForm({ name: "", description: "", scopes: "quotes:read payments:write payments:read customers:read beneficiaries:read beneficiaries:write", rateLimitPerMin: 60, webhookUrl: "", environment: "sandbox" });
    setRefresh((n) => n + 1);
  }

  async function handleAction() {
    if (!actionConsumer || !actionType) return;
    setActionLoading(true);

    const payload: Record<string, unknown> = {};
    if (actionType === "suspend")  payload.status = "suspended";
    if (actionType === "activate") payload.status = "active";
    if (actionType === "revoke")   payload.status = "revoked";
    if (actionType === "regen")    payload.regenerateSecret = true;

    const res  = await fetch(`/api/api-consumers/${actionConsumer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setActionLoading(false);
    if (!res.ok) { alert(json.error ?? "Action failed"); return; }
    if (actionType === "regen" && json.clientSecret) {
      setRegenResult(json.clientSecret);
      return;
    }
    setActionConsumer(null);
    setActionType(null);
    setRefresh((n) => n + 1);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div>
      <PageHeader
        title="API Consumers"
        description="Manage OAuth 2.0 client credentials for the Pangea Payment Rail."
        action={
          <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> New consumer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={(v) => { setEnvFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All environments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All environments</SelectItem>
            <SelectItem value="sandbox">Sandbox</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setRefresh((n) => n + 1)} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] hover:bg-[#F7F9FC]">
              <TableHead className="text-[#64748B] font-medium">Consumer</TableHead>
              <TableHead className="text-[#64748B] font-medium">Client ID</TableHead>
              <TableHead className="text-[#64748B] font-medium">Environment</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
              <TableHead className="text-[#64748B] font-medium">Rate limit</TableHead>
              <TableHead className="text-[#64748B] font-medium">Last used</TableHead>
              <TableHead className="text-[#64748B] font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : !data?.data.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-[#64748B]">No API consumers yet.</TableCell></TableRow>
            ) : data.data.map((c) => (
              <TableRow key={c.id} className="hover:bg-[#F7F9FC]">
                <TableCell>
                  <p className="font-medium text-[#1A2332]">{c.name}</p>
                  <p className="text-xs text-[#64748B]">{c.consumerRef}</p>
                </TableCell>
                <TableCell>
                  <code className="text-xs font-mono text-[#64748B] bg-[#F7F9FC] px-1.5 py-0.5 rounded">{c.clientId.slice(0, 20)}…</code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={ENV_COLOURS[c.environment] ?? ""}>{c.environment}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLOURS[c.status] ?? ""}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-[#64748B]">{c.rateLimitPerMin}/min</TableCell>
                <TableCell className="text-[#64748B]">{formatDate(c.lastUsedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    {c.status === "active" && (
                      <Button variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => { setActionConsumer(c); setActionType("suspend"); }}>
                        Suspend
                      </Button>
                    )}
                    {c.status === "suspended" && (
                      <Button variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => { setActionConsumer(c); setActionType("activate"); }}>
                        Reactivate
                      </Button>
                    )}
                    {c.status !== "revoked" && (
                      <Button variant="outline" size="sm" className="text-xs h-7 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/5"
                        onClick={() => { setActionConsumer(c); setActionType("regen"); setRegenResult(null); }}>
                        Regen secret
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#64748B]">
          <span>Showing {((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)} of {data.total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New API consumer</DialogTitle>
          </DialogHeader>

          {!created ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Name <span className="text-[#EF4444]">*</span></Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Aggregator Ltd" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional notes about this integration" />
              </div>
              <div className="space-y-1">
                <Label>Scopes</Label>
                <Input value={createForm.scopes} onChange={(e) => setCreateForm((f) => ({ ...f, scopes: e.target.value }))} />
                <p className="text-xs text-[#64748B]">Space-separated. Available: customers:read beneficiaries:read beneficiaries:write quotes:read payments:read payments:write</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rate limit (per minute)</Label>
                  <Input type="number" min={1} max={1000} value={createForm.rateLimitPerMin}
                    onChange={(e) => setCreateForm((f) => ({ ...f, rateLimitPerMin: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Environment</Label>
                  <Select value={createForm.environment} onValueChange={(v) => setCreateForm((f) => ({ ...f, environment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Webhook URL</Label>
                <Input value={createForm.webhookUrl} onChange={(e) => setCreateForm((f) => ({ ...f, webhookUrl: e.target.value }))} placeholder="https://partner.example.com/webhooks" />
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-4">
              <div className="rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 p-3 text-sm text-[#22C55E]">
                Consumer <strong>{created.consumerRef}</strong> created. Copy the credentials below — the client secret cannot be retrieved again.
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-[#64748B]">Client ID</Label>
                  <SecretReveal value={created.clientId} />
                </div>
                {created.clientSecret && (
                  <div>
                    <Label className="text-xs text-[#64748B]">Client Secret</Label>
                    <SecretReveal value={created.clientSecret} />
                  </div>
                )}
                {created.webhookSecret && (
                  <div>
                    <Label className="text-xs text-[#64748B]">Webhook Signing Secret</Label>
                    <SecretReveal value={created.webhookSecret} />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {!created ? (
              <>
                <Button variant="outline" onClick={closeCreate}>Cancel</Button>
                <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={handleCreate} disabled={creating || !createForm.name}>
                  {creating ? "Creating…" : "Create consumer"}
                </Button>
              </>
            ) : (
              <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={closeCreate}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action dialog */}
      <Dialog open={!!actionConsumer} onOpenChange={(o) => { if (!o) { setActionConsumer(null); setActionType(null); setRegenResult(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend"  && "Suspend consumer"}
              {actionType === "activate" && "Reactivate consumer"}
              {actionType === "revoke"   && "Revoke consumer"}
              {actionType === "regen"    && "Regenerate client secret"}
            </DialogTitle>
          </DialogHeader>

          {regenResult ? (
            <div className="py-2 space-y-3">
              <div className="rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 p-3 text-sm text-[#22C55E]">
                New secret generated. Copy it now — it cannot be retrieved again.
              </div>
              <div>
                <Label className="text-xs text-[#64748B]">New Client Secret</Label>
                <SecretReveal value={regenResult} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#64748B] py-2">
              {actionType === "suspend"  && `This will suspend ${actionConsumer?.name} and prevent any new API calls until reactivated.`}
              {actionType === "activate" && `This will reactivate ${actionConsumer?.name} and allow API access.`}
              {actionType === "revoke"   && `This will permanently revoke ${actionConsumer?.name}. This cannot be undone.`}
              {actionType === "regen"    && `This will invalidate the existing secret for ${actionConsumer?.name}. All active tokens will stop working.`}
            </p>
          )}

          <DialogFooter>
            {!regenResult ? (
              <>
                <Button variant="outline" onClick={() => { setActionConsumer(null); setActionType(null); }}>Cancel</Button>
                <Button
                  className={actionType === "revoke" ? "bg-[#EF4444] hover:bg-red-600 text-white" : "bg-[#1E4D8C] hover:bg-[#1a4279] text-white"}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Please wait…" : "Confirm"}
                </Button>
              </>
            ) : (
              <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
                onClick={() => { setActionConsumer(null); setActionType(null); setRegenResult(null); setRefresh((n) => n + 1); }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
