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

const STEPS = [
  { id: 1, label: "Personal details" },
  { id: 2, label: "Address" },
  { id: 3, label: "Documents" },
  { id: 4, label: "Review & submit" },
];

const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "United Arab Emirates" },
].sort((a, b) => a.name.localeCompare(b.name));

const SOURCE_OF_FUNDS = [
  "Salary / employment income",
  "Self-employment / business income",
  "Investments",
  "Savings",
  "Inheritance",
  "Pension",
  "Rental income",
  "Gift",
  "Other",
];

type FormData = {
  firstName: string; lastName: string; dateOfBirth: string;
  nationality: string; countryOfResidence: string;
  occupation: string; sourceOfFunds: string;
  addressLine1: string; addressLine2: string; city: string; postCode: string; country: string;
  documentType: string; documentNumber: string; issuingCountry: string; expiryDate: string;
  poaDocumentType: string;
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step.id < current
                  ? "bg-[#2A9D8F] text-white"
                  : step.id === current
                  ? "bg-[#1E4D8C] text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {step.id < current ? "✓" : step.id}
            </div>
            <span className={`text-xs mt-1 text-center whitespace-nowrap ${step.id === current ? "text-[#1A2332] font-medium" : "text-[#64748B]"}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 ${step.id < current ? "bg-[#2A9D8F]" : "bg-[#E2E8F0]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", dateOfBirth: "",
    nationality: "", countryOfResidence: "",
    occupation: "", sourceOfFunds: "",
    addressLine1: "", addressLine2: "", city: "", postCode: "", country: "",
    documentType: "passport", documentNumber: "", issuingCountry: "", expiryDate: "",
    poaDocumentType: "utility_bill",
  });

  function f(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.firstName || !form.lastName) return "First and last name are required.";
      if (!form.dateOfBirth) return "Date of birth is required.";
      if (!form.nationality) return "Nationality is required.";
      if (!form.countryOfResidence) return "Country of residence is required.";
      if (!form.occupation) return "Occupation is required.";
      if (!form.sourceOfFunds) return "Source of funds is required.";
    }
    if (s === 2) {
      if (!form.addressLine1 || !form.city || !form.postCode || !form.country) {
        return "Please complete all required address fields.";
      }
    }
    if (s === 3) {
      if (!form.documentNumber || !form.issuingCountry || !form.expiryDate) {
        return "Please complete all required document fields.";
      }
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
      body:    JSON.stringify({
        firstName:          form.firstName,
        lastName:           form.lastName,
        dateOfBirth:        form.dateOfBirth,
        nationality:        form.nationality,
        countryOfResidence: form.countryOfResidence,
        occupation:         form.occupation,
        sourceOfFunds:      form.sourceOfFunds,
        addressLine1:       form.addressLine1,
        addressLine2:       form.addressLine2 || null,
        city:               form.city,
        postCode:           form.postCode,
        country:            form.country,
        documentType:       form.documentType,
        documentNumber:     form.documentNumber,
        issuingCountry:     form.issuingCountry,
        expiryDate:         form.expiryDate,
        poaDocumentType:    form.poaDocumentType || undefined,
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

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Verify your identity</h1>
        <p className="text-[#64748B] mt-1 text-sm">We need to verify your identity to activate your account. This takes about 5 minutes.</p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <Alert className="mb-4 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </Alert>
      )}

      <Card className="p-6 border-[#E2E8F0] bg-white">
        {/* Step 1 — Personal details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#1A2332]">Personal details</h2>

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
              <Input type="date" value={form.dateOfBirth} onChange={(e) => f("dateOfBirth", e.target.value)} />
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
                <Label>Country of residence <span className="text-red-500">*</span></Label>
                <Select value={form.countryOfResidence} onChange={(e) => f("countryOfResidence", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Occupation <span className="text-red-500">*</span></Label>
              <Input value={form.occupation} onChange={(e) => f("occupation", e.target.value)} placeholder="e.g. Software Engineer" />
            </div>

            <div className="space-y-1.5">
              <Label>Source of funds <span className="text-red-500">*</span></Label>
              <Select value={form.sourceOfFunds} onChange={(e) => f("sourceOfFunds", e.target.value)}>
                <option value="">Select…</option>
                {SOURCE_OF_FUNDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* Step 2 — Address */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#1A2332]">Home address</h2>

            <div className="space-y-1.5">
              <Label>Address line 1 <span className="text-red-500">*</span></Label>
              <Input value={form.addressLine1} onChange={(e) => f("addressLine1", e.target.value)} placeholder="123 Main Street" />
            </div>

            <div className="space-y-1.5">
              <Label>Address line 2</Label>
              <Input value={form.addressLine2} onChange={(e) => f("addressLine2", e.target.value)} placeholder="Apartment, suite, etc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City <span className="text-red-500">*</span></Label>
                <Input value={form.city} onChange={(e) => f("city", e.target.value)} placeholder="London" />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode / ZIP <span className="text-red-500">*</span></Label>
                <Input value={form.postCode} onChange={(e) => f("postCode", e.target.value)} placeholder="SW1A 1AA" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Country <span className="text-red-500">*</span></Label>
              <Select value={form.country} onChange={(e) => f("country", e.target.value)}>
                <option value="">Select…</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* Step 3 — Documents */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#1A2332]">Identity document</h2>
              <p className="text-sm text-[#64748B] mt-0.5">Provide the details of your primary identity document.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Document type <span className="text-red-500">*</span></Label>
              <Select value={form.documentType} onChange={(e) => f("documentType", e.target.value)}>
                <option value="passport">Passport</option>
                <option value="national_id">National ID card</option>
                <option value="driving_licence">Driving licence</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Document number <span className="text-red-500">*</span></Label>
              <Input value={form.documentNumber} onChange={(e) => f("documentNumber", e.target.value)} placeholder="e.g. 123456789" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Issuing country <span className="text-red-500">*</span></Label>
                <Select value={form.issuingCountry} onChange={(e) => f("issuingCountry", e.target.value)}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => f("expiryDate", e.target.value)} />
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold text-[#1A2332]">Proof of address</h2>
              <p className="text-sm text-[#64748B] mt-0.5">Select the document you will provide as proof of address.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Document type</Label>
              <Select value={form.poaDocumentType} onChange={(e) => f("poaDocumentType", e.target.value)}>
                <option value="">None — skip</option>
                <option value="utility_bill">Utility bill (dated within 3 months)</option>
                <option value="bank_statement">Bank statement (dated within 3 months)</option>
                <option value="proof_of_address">Other proof of address</option>
              </Select>
            </div>

            <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 bg-[#F7F9FC]">
              <p className="text-sm text-[#64748B] text-center">
                Document upload will be available once file storage is configured.
                <br />
                Your document details have been recorded.
              </p>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-[#1A2332]">Review and submit</h2>
            <p className="text-sm text-[#64748B]">
              Please review your details below before submitting. Once submitted, our team will review your application and verify your identity.
            </p>

            <div className="space-y-3">
              <ReviewSection title="Personal details">
                <ReviewField label="Name" value={`${form.firstName} ${form.lastName}`} />
                <ReviewField label="Date of birth" value={form.dateOfBirth} />
                <ReviewField label="Nationality" value={COUNTRIES.find((c) => c.code === form.nationality)?.name ?? form.nationality} />
                <ReviewField label="Country of residence" value={COUNTRIES.find((c) => c.code === form.countryOfResidence)?.name ?? form.countryOfResidence} />
                <ReviewField label="Occupation" value={form.occupation} />
                <ReviewField label="Source of funds" value={form.sourceOfFunds} />
              </ReviewSection>

              <ReviewSection title="Address">
                <ReviewField label="Address" value={[form.addressLine1, form.addressLine2, form.city, form.postCode].filter(Boolean).join(", ")} />
                <ReviewField label="Country" value={COUNTRIES.find((c) => c.code === form.country)?.name ?? form.country} />
              </ReviewSection>

              <ReviewSection title="Documents">
                <ReviewField label="ID type" value={form.documentType.replace(/_/g, " ")} />
                <ReviewField label="Document number" value={form.documentNumber} />
                <ReviewField label="Expiry date" value={form.expiryDate} />
              </ReviewSection>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7F9FC] p-4">
              <p className="text-sm text-[#64748B]">
                By submitting this application, you confirm that all details are accurate and complete. False information may result in your application being declined.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-[#F0F4F8]">
          {step > 1 ? (
            <Button variant="outline" onClick={() => { setStep((s) => s - 1); setError(""); }}>
              Back
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button className="bg-[#1E4D8C] hover:bg-[#1a4279] text-white" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button
              className="bg-[#E9A820] hover:bg-[#d4971d] text-white px-6"
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

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div className="bg-[#F7F9FC] px-4 py-2.5 border-b border-[#E2E8F0]">
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
      <p className="text-sm text-[#1A2332] text-right capitalize">{value || "—"}</p>
    </div>
  );
}
