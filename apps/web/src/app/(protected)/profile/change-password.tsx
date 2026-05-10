"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function ChangePasswordForm() {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function f(field: "current" | "next" | "confirm", value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function reset() {
    setOpen(false);
    setError("");
    setSuccess(false);
    setForm({ current: "", next: "", confirm: "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (form.next !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    const res  = await fetch("/api/profile/password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to update password.");
      return;
    }

    setSuccess(true);
    setForm({ current: "", next: "", confirm: "" });
    setTimeout(reset, 2500);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[#4A8C1C] hover:underline font-medium flex items-center gap-1"
      >
        Change password →
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error   && <Alert className="text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>}
      {success && <Alert className="text-sm text-green-700 bg-green-50 border-green-200">Password updated successfully.</Alert>}

      <div className="space-y-1.5">
        <Label htmlFor="cp-current">Current password</Label>
        <Input
          id="cp-current"
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={(e) => f("current", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cp-new">New password</Label>
        <Input
          id="cp-new"
          type="password"
          autoComplete="new-password"
          value={form.next}
          onChange={(e) => f("next", e.target.value)}
        />
        <p className="text-xs text-[#64748B]">Minimum 12 characters — uppercase, lowercase, number, and symbol.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cp-confirm">Confirm new password</Label>
        <Input
          id="cp-confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => f("confirm", e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
