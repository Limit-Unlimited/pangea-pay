"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CustomerType = "individual" | "business";

export default function NewCustomerPage() {
  const router = useRouter();
  const [type, setType] = useState<CustomerType>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Individual
    firstName: "", lastName: "", dateOfBirth: "", nationality: "",
    countryOfResidence: "", occupation: "", employerName: "",
    // Business
    legalEntityName: "", tradingName: "", registrationNumber: "",
    incorporationCountry: "", incorporationDate: "", businessType: "", businessSector: "",
    // Shared
    email: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", postCode: "", country: "", sourceOfFunds: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const payload: Record<string, any> = { type };
    Object.entries(form).forEach(([k, v]) => { if (v) payload[k] = v; });

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to create customer.");
      return;
    }

    router.push(`/customers/${json.id}`);
  }

  return (
    <div>
      <PageHeader
        title="Add customer"
        description="Create a new customer record."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Type */}
        <Card className="p-6 border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Customer type</h2>
          <div className="flex gap-3">
            {(["individual", "business"] as CustomerType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium capitalize transition-colors
                  ${type === t
                    ? "border-[#1E4D8C] bg-[#1E4D8C]/5 text-[#1E4D8C]"
                    : "border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        {/* Individual fields */}
        {type === "individual" && (
          <Card className="p-6 border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Personal details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First name <span className="text-red-500">*</span></Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Last name <span className="text-red-500">*</span></Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nationality (ISO)</Label>
                <Input placeholder="e.g. GB" maxLength={2} value={form.nationality} onChange={(e) => set("nationality", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Country of residence (ISO)</Label>
                <Input placeholder="e.g. GB" maxLength={2} value={form.countryOfResidence} onChange={(e) => set("countryOfResidence", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Employer name</Label>
                <Input value={form.employerName} onChange={(e) => set("employerName", e.target.value)} />
              </div>
            </div>
          </Card>
        )}

        {/* Business fields */}
        {type === "business" && (
          <Card className="p-6 border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Business details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Legal entity name <span className="text-red-500">*</span></Label>
                <Input value={form.legalEntityName} onChange={(e) => set("legalEntityName", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Trading name</Label>
                <Input value={form.tradingName} onChange={(e) => set("tradingName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Registration number</Label>
                <Input value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Incorporation country (ISO)</Label>
                <Input placeholder="e.g. GB" maxLength={2} value={form.incorporationCountry} onChange={(e) => set("incorporationCountry", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Incorporation date</Label>
                <Input type="date" value={form.incorporationDate} onChange={(e) => set("incorporationDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Input placeholder="e.g. Ltd, LLC" value={form.businessType} onChange={(e) => set("businessType", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Business sector</Label>
                <Input value={form.businessSector} onChange={(e) => set("businessSector", e.target.value)} />
              </div>
            </div>
          </Card>
        )}

        {/* Contact & Address */}
        <Card className="p-6 border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#1A2332] mb-4">Contact and address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Address line 1</Label>
              <Input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Address line 2</Label>
              <Input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Post code</Label>
              <Input value={form.postCode} onChange={(e) => set("postCode", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Country (ISO)</Label>
              <Input placeholder="e.g. GB" maxLength={2} value={form.country} onChange={(e) => set("country", e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>Source of funds</Label>
              <Input placeholder="e.g. Employment income" value={form.sourceOfFunds} onChange={(e) => set("sourceOfFunds", e.target.value)} />
            </div>
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
