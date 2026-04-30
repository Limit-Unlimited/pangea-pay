"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { COUNTRIES } from "@/lib/data/countries";

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Address" },
  { id: 3, label: "Signatory" },
  { id: 4, label: "Documents" },
  { id: 5, label: "Review" },
];

const BUSINESS_TYPES = [
  "Private Limited Company (Ltd)",
  "Public Limited Company (PLC)",
  "Limited Liability Partnership (LLP)",
  "Partnership",
  "Sole Trader",
  "Non-profit / Charity",
  "Other",
];

const BUSINESS_SECTORS = [
  "Finance & Fintech",
  "Technology",
  "Retail & E-commerce",
  "Import & Export",
  "Manufacturing",
  "Real Estate",
  "Healthcare",
  "Education",
  "Hospitality & Tourism",
  "Construction",
  "Media & Entertainment",
  "Professional Services",
  "Agriculture",
  "Other",
];

const SOURCE_OF_FUNDS = [
  "Business revenue / trading income",
  "Investment / venture capital",
  "Loans / financing",
  "Shareholder capital",
  "Asset sales",
  "Grant funding",
  "Other",
];

type FormData = {
  // Step 1 — Company details
  legalEntityName:      string;
  tradingName:          string;
  registrationNumber:   string;
  incorporationCountry: string;
  incorporationDate:    string;
  businessType:         string;
  businessSector:       string;
  // Step 2 — Address & funding
  addressLine1:  string;
  addressLine2:  string;
  city:          string;
  postCode:      string;
  country:       string;
  sourceOfFunds: string;
  // Step 3 — Authorised signatory
  firstName:   string;
  lastName:    string;
  dateOfBirth: string;
  nationality: string;
  jobTitle:    string;
  // Step 4 — Documents
  incorporationDocType: string;
  poaDocType:           string;
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step.id < current    ? "bg-[#B0D980] text-white"
              : step.id === current ? "bg-[#4A8C1C] text-white"
              : "bg-[#E2E8F0] text-[#64748B]"
            }`}>
              {step.id < current ? "✓" : step.id}
            </div>
            <span className={`text-xs mt-1 text-center hidden sm:block ${step.id === current ? "text-[#1A2332] font-medium" : "text-[#64748B]"}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-5 sm:mx-2 ${step.id < current ? "bg-[#B0D980]" : "bg-[#E2E8F0]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div className="bg-[#F8FBEF] px-4 py-2.5 border-b border-[#E2E8F0]">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <p className="text-sm text-[#64748B] shrink-0">{label}</p>
      <p className="text-sm text-[#1A2332] text-right">{value || "—"}</p>
    </div>
  );
}

export function BusinessForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    legalEntityName:      "",
    tradingName:          "",
    registrationNumber:   "",
    incorporationCountry: "",
    incorporationDate:    "",
    businessType:         "",
    businessSector:       "",
    addressLine1:  "",
    addressLine2:  "",
    city:          "",
    postCode:      "",
    country:       "",
    sourceOfFunds: "",
    firstName:   "",
    lastName:    "",
    dateOfBirth: "",
    nationality: "",
    jobTitle:    "",
    incorporationDocType: "certificate_of_incorporation",
    poaDocType:           "proof_of_address",
  });

  function f(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.legalEntityName)      return "Legal entity name is required.";
      if (!form.registrationNumber)   return "Registration number is required.";
      if (!form.incorporationCountry) return "Country of incorporation is required.";
      if (!form.incorporationDate)    return "Date of incorporation is required.";
      if (!form.businessType)         return "Business type is required.";
      if (!form.businessSector)       return "Business sector is required.";
    }
    if (s === 2) {
      if (!form.addressLine1 || !form.city || !form.postCode || !form.country) {
        return "Please complete all required address fields.";
      }
      if (!form.sourceOfFunds) return "Source of business funds is required.";
    }
    if (s === 3) {
      if (!form.firstName || !form.lastName) return "First and last name are required.";
      if (!form.dateOfBirth)                 return "Date of birth is required.";
      if (!form.nationality)                 return "Nationality is required.";
      if (!form.jobTitle)                    return "Job title is required.";
    }
    return null;
  }

  function next() {
    const msg = validateStep(step);
    if (msg) { setError(msg); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:                 "business",
        legalEntityName:      form.legalEntityName,
        tradingName:          form.tradingName || null,
        registrationNumber:   form.registrationNumber,
        incorporationCountry: form.incorporationCountry,
        incorporationDate:    form.incorporationDate,
        businessType:         form.businessType,
        businessSector:       form.businessSector,
        addressLine1:         form.addressLine1,
        addressLine2:         form.addressLine2 || null,
        city:                 form.city,
        postCode:             form.postCode,
        country:              form.country,
        sourceOfFunds:        form.sourceOfFunds,
        firstName:            form.firstName,
        lastName:             form.lastName,
        dateOfBirth:          form.dateOfBirth,
        nationality:          form.nationality,
        occupation:           form.jobTitle,
        incorporationDocType: form.incorporationDocType || undefined,
        poaDocType:           form.poaDocType || undefined,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Submission failed. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sm text-[#64748B] hover:text-[#4A8C1C] transition-colors mb-4 flex items-center gap-1"
        >
          ← Change account type
        </button>
        <h1 className="text-2xl font-bold text-[#1A2332]">Business verification</h1>
        <p className="text-[#64748B] mt-1 text-sm">
          Tell us about your business. Our team will review your application and may request additional documents.
        </p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Alert>
      )}

      <Card className="p-6 border-[#E2E8F0] bg-white">

        {/* ── Step 1: Company details ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#1A2332]">Company details</h2>

            <div className="space-y-1.5">
              <Label>Legal entity name <span className="text-red-500">*</span></Label>
              <Input
                value={form.legalEntityName}
                onChange={(e) => f("legalEntityName", e.target.value)}
                placeholder="e.g. Acme Trading Ltd"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Trading name <span className="text-[#64748B] font-normal">(if different)</span></Label>
              <Input
                value={form.tradingName}
                onChange={(e) => f("tradingName", e.target.value)}
                placeholder="e.g. Acme Payments"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Registration number <span className="text-red-500">*</span></Label>
                <Input
                  value={form.registrationNumber}
                  onChange={(e) => f("registrationNumber", e.target.value)}
                  placeholder="e.g. 12345678"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country of incorporation <span className="text-red-500">*</span></Label>
                <Select value={form.incorporationCountry} onChange={(e) => f("incorporationCountry", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Date of incorporation <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.incorporationDate}
                onChange={(e) => f("incorporationDate", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Business type <span className="text-red-500">*</span></Label>
                <Select value={form.businessType} onChange={(e) => f("businessType", e.target.value)}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Business sector <span className="text-red-500">*</span></Label>
                <Select value={form.businessSector} onChange={(e) => f("businessSector", e.target.value)}>
                  <option value="">Select…</option>
                  {BUSINESS_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Address & funding ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#1A2332]">Registered address</h2>

            <div className="space-y-1.5">
              <Label>Address line 1 <span className="text-red-500">*</span></Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => f("addressLine1", e.target.value)}
                placeholder="123 Business Street"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Address line 2</Label>
              <Input
                value={form.addressLine2}
                onChange={(e) => f("addressLine2", e.target.value)}
                placeholder="Suite, floor, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City <span className="text-red-500">*</span></Label>
                <Input value={form.city} onChange={(e) => f("city", e.target.value)} placeholder="London" />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode / ZIP <span className="text-red-500">*</span></Label>
                <Input value={form.postCode} onChange={(e) => f("postCode", e.target.value)} placeholder="EC1A 1BB" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Country <span className="text-red-500">*</span></Label>
              <Select value={form.country} onChange={(e) => f("country", e.target.value)}>
                <option value="">Select…</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>Source of business funds <span className="text-red-500">*</span></Label>
              <p className="text-xs text-[#64748B]">Where does the money your business sends come from?</p>
              <Select value={form.sourceOfFunds} onChange={(e) => f("sourceOfFunds", e.target.value)}>
                <option value="">Select…</option>
                {SOURCE_OF_FUNDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* ── Step 3: Authorised signatory ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#1A2332]">Authorised signatory</h2>
              <p className="text-sm text-[#64748B] mt-0.5">
                Details of the person completing this application and authorised to act on behalf of the business.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name <span className="text-red-500">*</span></Label>
                <Input value={form.firstName} onChange={(e) => f("firstName", e.target.value)} placeholder="Jane" />
              </div>
              <div className="space-y-1.5">
                <Label>Last name <span className="text-red-500">*</span></Label>
                <Input value={form.lastName} onChange={(e) => f("lastName", e.target.value)} placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Date of birth <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => f("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nationality <span className="text-red-500">*</span></Label>
                <Select value={form.nationality} onChange={(e) => f("nationality", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job title <span className="text-red-500">*</span></Label>
                <Input
                  value={form.jobTitle}
                  onChange={(e) => f("jobTitle", e.target.value)}
                  placeholder="e.g. Director"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#D1E8B8] bg-[#F8FBEF] p-4">
              <p className="text-sm text-[#64748B]">
                The signatory must be authorised by the business to open and manage accounts on its behalf.
                You may be asked to provide a letter of authorisation during the review process.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Documents ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#1A2332]">Business documents</h2>
              <p className="text-sm text-[#64748B] mt-0.5">
                Select the documents you will provide. Our team will contact you to collect them.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Proof of incorporation <span className="text-red-500">*</span></Label>
              <Select
                value={form.incorporationDocType}
                onChange={(e) => f("incorporationDocType", e.target.value)}
              >
                <option value="certificate_of_incorporation">Certificate of incorporation</option>
                <option value="company_registration">Company registration document</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Proof of registered address</Label>
              <Select value={form.poaDocType} onChange={(e) => f("poaDocType", e.target.value)}>
                <option value="">None — skip</option>
                <option value="utility_bill">Utility bill (dated within 3 months)</option>
                <option value="bank_statement">Bank statement (dated within 3 months)</option>
                <option value="proof_of_address">Other proof of address</option>
              </Select>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-[#1A2332] mb-2">You may also be asked to provide:</p>
              <ul className="text-sm text-[#64748B] space-y-1 list-disc list-inside">
                <li>Articles of association or memorandum</li>
                <li>List of directors and beneficial owners</li>
                <li>Proof of identity for each UBO holding 25%+ of shares</li>
                <li>Most recent audited accounts (if available)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 bg-[#F8FBEF]">
              <p className="text-sm text-[#64748B] text-center">
                Document upload will be available once file storage is configured.
                <br />Our team will reach out to collect documents after your application is submitted.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 5: Review & submit ── */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-[#1A2332]">Review and submit</h2>
            <p className="text-sm text-[#64748B]">
              Please review your details before submitting. Our compliance team will review your application.
            </p>

            <div className="space-y-3">
              <ReviewSection title="Company details">
                <ReviewField label="Legal name"      value={form.legalEntityName} />
                {form.tradingName && <ReviewField label="Trading name" value={form.tradingName} />}
                <ReviewField label="Reg. number"     value={form.registrationNumber} />
                <ReviewField label="Incorporated in" value={countryName(form.incorporationCountry)} />
                <ReviewField label="Incorporated on" value={form.incorporationDate} />
                <ReviewField label="Business type"   value={form.businessType} />
                <ReviewField label="Sector"          value={form.businessSector} />
              </ReviewSection>

              <ReviewSection title="Registered address">
                <ReviewField
                  label="Address"
                  value={[form.addressLine1, form.addressLine2, form.city, form.postCode].filter(Boolean).join(", ")}
                />
                <ReviewField label="Country"        value={countryName(form.country)} />
                <ReviewField label="Source of funds" value={form.sourceOfFunds} />
              </ReviewSection>

              <ReviewSection title="Authorised signatory">
                <ReviewField label="Name"        value={`${form.firstName} ${form.lastName}`} />
                <ReviewField label="Date of birth" value={form.dateOfBirth} />
                <ReviewField label="Nationality"  value={countryName(form.nationality)} />
                <ReviewField label="Job title"    value={form.jobTitle} />
              </ReviewSection>

              <ReviewSection title="Documents">
                <ReviewField label="Incorporation" value={form.incorporationDocType.replace(/_/g, " ")} />
                {form.poaDocType && <ReviewField label="Proof of address" value={form.poaDocType.replace(/_/g, " ")} />}
              </ReviewSection>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBEF] p-4">
              <p className="text-sm text-[#64748B]">
                By submitting this application, you confirm that you are authorised to act on behalf of the business
                and that all information provided is accurate and complete. Providing false information may result in
                your application being declined and may be referred to the relevant authorities.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-[#F0F4F8]">
          {step > 1 ? (
            <Button variant="outline" onClick={() => { setStep((s) => s - 1); setError(""); }}>
              Back
            </Button>
          ) : <div />}

          {step < 5 ? (
            <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button
              className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white px-6"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
