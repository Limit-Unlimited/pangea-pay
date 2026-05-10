"use client";

import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchItem = {
  companyNumber: string;
  title: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string | null;
  address: { addressLine1: string | null; locality: string | null; postalCode: string | null };
};

export type CompanyData = {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string | null;
  jurisdiction: string | null;
  address: {
    addressLine1: string | null; addressLine2: string | null;
    locality: string | null; region: string | null;
    postalCode: string | null; country: string | null;
  };
  directors: Array<{ name: string; firstName: string; lastName: string; role: string; appointedOn: string | null }>;
};

export function CompaniesHouseSearch({ onSelect }: { onSelect: (data: CompanyData) => void }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [open, setOpen]         = useState(false);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/companies-house/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.items ?? []);
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function pick(item: SearchItem) {
    setOpen(false);
    setQuery(item.title);
    setLoadingDetail(true);
    try {
      const res  = await fetch(`/api/companies-house/company/${item.companyNumber}`);
      const data = await res.json() as CompanyData;
      setSelectedNumber(item.companyNumber);
      onSelect(data);
    } finally {
      setLoadingDetail(false);
    }
  }

  const busy = searching || loadingDetail;

  return (
    <div ref={wrapRef} className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedNumber(null); }}
          placeholder="Search by company name or registration number…"
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {busy && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] animate-spin pointer-events-none" />
        )}
      </div>

      {selectedNumber && !loadingDetail && (
        <p className="text-xs text-[#4A8C1C] flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Details filled from Companies House — review and edit if needed
        </p>
      )}

      {open && (
        <div className="absolute z-50 w-full bg-white rounded-lg border border-[#E2E8F0] shadow-lg overflow-hidden">
          {results.length > 0 ? results.map((item) => (
            <button
              key={item.companyNumber}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-[#F8FBEF] border-b border-[#F0F4F8] last:border-0 transition-colors"
              onMouseDown={(e) => { e.preventDefault(); pick(item); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A2332] truncate">{item.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {item.companyNumber}
                    {item.address.locality ? ` · ${item.address.locality}` : ""}
                    {item.address.postalCode ? ` · ${item.address.postalCode}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                  item.companyStatus === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-[#F0F7E6] text-[#64748B]"
                }`}>
                  {item.companyStatus}
                </span>
              </div>
            </button>
          )) : !searching ? (
            <div className="px-4 py-3 text-sm text-[#64748B]">
              No companies found for &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
