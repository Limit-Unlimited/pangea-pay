import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { User, Building2, FileText, Link2, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { db, webUsers, customers, customerDocuments, webUserCustomerLinks } from "@pangea/db";
import { resolveCustomerId } from "@/lib/auth/context";
import { Card } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOC_LABELS: Record<string, string> = {
  passport:                    "Passport",
  national_id:                 "National ID card",
  driving_licence:             "Driving licence",
  proof_of_address:            "Proof of address",
  company_registration:        "Company registration",
  certificate_of_incorporation:"Certificate of incorporation",
  bank_statement:              "Bank statement",
  utility_bill:                "Utility bill",
  other:                       "Other document",
};

const DOC_STATUS_STYLE: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const ONBOARDING_STATUS_STYLE: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  under_review: "bg-blue-100 text-blue-700",
  approved:     "bg-green-100 text-green-700",
  rejected:     "bg-red-100 text-red-700",
};

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return String(value);
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      <p className="text-sm text-[#1A2332]">{value}</p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-[#1A2332]">{title}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);
  if (!webUser) redirect("/login");

  const activeCustomerId = resolveCustomerId(webUser);

  const [customer] = activeCustomerId
    ? await db.select().from(customers).where(eq(customers.id, activeCustomerId)).limit(1)
    : [null];

  const docs = activeCustomerId
    ? await db.select().from(customerDocuments).where(eq(customerDocuments.customerId, activeCustomerId))
    : [];

  const links = await db
    .select({
      customerId:       webUserCustomerLinks.customerId,
      type:             customers.type,
      firstName:        customers.firstName,
      lastName:         customers.lastName,
      legalEntityName:  customers.legalEntityName,
      onboardingStatus: customers.onboardingStatus,
      customerRef:      customers.customerRef,
    })
    .from(webUserCustomerLinks)
    .innerJoin(customers, eq(webUserCustomerLinks.customerId, customers.id))
    .where(
      and(
        eq(webUserCustomerLinks.userId,  webUser.id),
        eq(webUserCustomerLinks.status,  "active"),
      ),
    );

  const initials = customer
    ? customer.type === "business"
      ? (customer.legalEntityName ?? "B").slice(0, 2).toUpperCase()
      : `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase() || "?"
    : webUser.email.slice(0, 2).toUpperCase();

  const displayName = customer
    ? customer.type === "business"
      ? (customer.legalEntityName ?? "Business account")
      : `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "My account"
    : webUser.email;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card className="p-6 border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#4A8C1C] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl select-none">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1A2332] truncate">{displayName}</h1>
            <p className="text-sm text-[#64748B]">{webUser.email}</p>
            {webUser.phoneNumber && (
              <p className="text-sm text-[#64748B]">{webUser.phoneNumber}</p>
            )}
            {customer && (
              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-50 text-[#4A8C1C] font-medium font-mono">
                {customer.customerRef}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Profile details ─────────────────────────────────────────────────── */}
      {customer && (
        <Card className="p-6 border-gray-200 bg-white">
          <SectionHeader
            icon={<User className="h-3.5 w-3.5 text-[#4A8C1C]" />}
            title="My details"
          />

          {customer.type === "individual" ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="First name"           value={customer.firstName} />
              <Field label="Last name"            value={customer.lastName} />
              <Field label="Date of birth"        value={formatDate(customer.dateOfBirth)} />
              <Field label="Nationality"          value={customer.nationality} />
              <Field label="Country of residence" value={customer.countryOfResidence} />
              <Field label="Occupation"           value={customer.occupation} />
              <div className="col-span-2">
                <Field
                  label="Address"
                  value={[customer.addressLine1, customer.addressLine2, customer.city, customer.postCode, customer.country]
                    .filter(Boolean).join(", ")}
                />
              </div>
              <div className="col-span-2">
                <Field label="Source of funds" value={customer.sourceOfFunds} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2"><Field label="Legal entity name"       value={customer.legalEntityName} /></div>
              {customer.tradingName && <div className="col-span-2"><Field label="Trading name" value={customer.tradingName} /></div>}
              <Field label="Registration number"      value={customer.registrationNumber} />
              <Field label="Country of incorporation" value={customer.incorporationCountry} />
              <Field label="Date of incorporation"    value={formatDate(customer.incorporationDate)} />
              <Field label="Business type"            value={customer.businessType} />
              <div className="col-span-2"><Field label="Business sector" value={customer.businessSector} /></div>
              <div className="col-span-2">
                <Field
                  label="Registered address"
                  value={[customer.addressLine1, customer.addressLine2, customer.city, customer.postCode, customer.country]
                    .filter(Boolean).join(", ")}
                />
              </div>
              <div className="col-span-2"><Field label="Source of funds" value={customer.sourceOfFunds} /></div>

              {(customer.firstName || customer.lastName) && (
                <div className="col-span-2 pt-3 border-t border-[#F0F4F8]">
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Authorised signatory</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Name"         value={`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()} />
                    <Field label="Job title"    value={customer.occupation} />
                    <Field label="Date of birth" value={formatDate(customer.dateOfBirth)} />
                    <Field label="Nationality"  value={customer.nationality} />
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-[#64748B] mt-5 pt-4 border-t border-[#F0F4F8]">
            To update your details, contact{" "}
            <a href="mailto:support@pangea.local" className="text-[#4A8C1C] hover:underline">support</a>.
            Changes to verified information require re-verification.
          </p>
        </Card>
      )}

      {/* ── KYC documents ───────────────────────────────────────────────────── */}
      {docs.length > 0 && (
        <Card className="p-6 border-gray-200 bg-white">
          <SectionHeader
            icon={<FileText className="h-3.5 w-3.5 text-[#4A8C1C]" />}
            title="KYC documents"
          />
          <div className="space-y-0 divide-y divide-[#F0F4F8]">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <p className="text-sm text-[#1A2332]">
                  {DOC_LABELS[doc.documentType] ?? doc.documentType}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DOC_STATUS_STYLE[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Linked accounts ─────────────────────────────────────────────────── */}
      <Card className="p-6 border-gray-200 bg-white">
        <SectionHeader
          icon={<Link2 className="h-3.5 w-3.5 text-[#4A8C1C]" />}
          title="Linked accounts"
        />
        <div className="divide-y divide-[#F0F4F8]">
          {links.map((link) => {
            const name = link.type === "business"
              ? (link.legalEntityName ?? "Business account")
              : `${link.firstName ?? ""} ${link.lastName ?? ""}`.trim() || "Personal account";
            const isActive = link.customerId === activeCustomerId;

            return (
              <div key={link.customerId} className="flex items-center gap-3 py-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-[#4A8C1C]" : "bg-gray-50"}`}>
                  {link.type === "business"
                    ? <Building2 className={`h-4 w-4 ${isActive ? "text-white" : "text-[#4A8C1C]"}`} />
                    : <User      className={`h-4 w-4 ${isActive ? "text-white" : "text-[#4A8C1C]"}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2332] truncate">{name}</p>
                  <p className="text-xs text-[#64748B] capitalize">{link.type} · {link.customerRef}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${ONBOARDING_STATUS_STYLE[link.onboardingStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  {link.onboardingStatus?.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-[#F0F4F8]">
          <Link href="/onboarding" className="text-sm text-[#4A8C1C] hover:underline font-medium">
            + Add another account
          </Link>
        </div>
      </Card>

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <Card className="p-6 border-gray-200 bg-white">
        <SectionHeader
          icon={<ShieldCheck className="h-3.5 w-3.5 text-[#4A8C1C]" />}
          title="Security"
        />
        <ChangePasswordForm />
      </Card>

    </div>
  );
}
