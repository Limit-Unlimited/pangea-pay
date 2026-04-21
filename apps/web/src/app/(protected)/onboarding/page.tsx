"use client";

import { useState, useEffect } from "react";
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
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
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
                  ? "bg-[#B0D980] text-white"
                  : step.id === current
                  ? "bg-[#4A8C1C] text-white"
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
            <div className={`flex-1 h-0.5 mx-2 mb-5 ${step.id < current ? "bg-[#B0D980]" : "bg-[#E2E8F0]"}`} />
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

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data?.country_code) {
          setForm((p) => ({ ...p, countryOfResidence: data.country_code }));
        }
      })
      .catch(() => null);
  }, []);

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

            <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 bg-[#F8FBEF]">
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

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBEF] p-4">
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
      <p className="text-sm text-[#1A2332] text-right capitalize">{value || "—"}</p>
    </div>
  );
}
