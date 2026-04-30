"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User, Building2, Plus, Check } from "lucide-react";

export type LinkedCustomer = {
  id:          string;
  displayName: string;
  type:        "individual" | "business";
  isActive:    boolean;
};

export function ContextSwitcher({ customers }: { customers: LinkedCustomer[] }) {
  const router   = useRouter();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref      = useRef<HTMLDivElement>(null);

  const active = customers.find((c) => c.isActive) ?? customers[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function switchTo(customerId: string) {
    if (customerId === active?.id || loading) return;
    setLoading(true);
    setOpen(false);
    await fetch("/api/context", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ customerId }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!active) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-lg border border-[#D1E8B8] bg-[#F8FBEF] hover:bg-[#F0F7E6] transition-colors text-sm disabled:opacity-60"
      >
        {active.type === "business"
          ? <Building2 className="w-3.5 h-3.5 text-[#4A8C1C]" />
          : <User className="w-3.5 h-3.5 text-[#4A8C1C]" />}
        <span className="font-medium text-[#1A2332] max-w-[120px] truncate">{active.displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl border border-[#D1E8B8] shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#F0F4F8]">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Switch account</p>
          </div>

          <div className="py-1">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => switchTo(c.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FBEF] transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  c.type === "business" ? "bg-[#F0F7E6] border border-[#B0D980]" : "bg-[#F8FBEF] border border-[#E2E8F0]"
                }`}>
                  {c.type === "business"
                    ? <Building2 className="w-4 h-4 text-[#4A8C1C]" />
                    : <User className="w-4 h-4 text-[#64748B]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2332] truncate">{c.displayName}</p>
                  <p className="text-xs text-[#64748B] capitalize">{c.type} account</p>
                </div>
                {c.isActive && <Check className="w-4 h-4 text-[#4A8C1C] shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-[#F0F4F8] py-1">
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FBEF] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#F0F7E6] border border-dashed border-[#B0D980] flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-[#4A8C1C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#4A8C1C]">Add another account</p>
                <p className="text-xs text-[#64748B]">Individual or business</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
