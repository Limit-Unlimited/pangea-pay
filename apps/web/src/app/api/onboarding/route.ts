import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers, customers, customerDocuments } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({
  // Personal details
  firstName:           z.string().min(1).max(100),
  lastName:            z.string().min(1).max(100),
  dateOfBirth:         z.string().min(1),
  nationality:         z.string().length(2),
  countryOfResidence:  z.string().length(2),
  occupation:          z.string().min(1).max(150),
  sourceOfFunds:       z.string().min(1).max(150),

  // Address
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city:         z.string().min(1).max(100),
  postCode:     z.string().min(1).max(20),
  country:      z.string().length(2),

  // Document metadata (binary upload deferred; metadata captured now)
  documentType:   z.enum(["passport", "national_id", "driving_licence"]),
  documentNumber: z.string().min(1).max(100),
  issuingCountry: z.string().length(2),
  expiryDate:     z.string().min(1),

  // Proof of address document metadata
  poaDocumentType: z.enum(["utility_bill", "bank_statement", "proof_of_address"]).optional(),
});

// POST /api/onboarding — submit KYC details
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const userId = session.user.id;

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, userId))
    .limit(1);

  if (!webUser) return unauthorized();

  // Don't allow re-submission if already linked to an approved customer
  if (webUser.customerId) {
    const [cust] = await db
      .select({ onboardingStatus: customers.onboardingStatus })
      .from(customers)
      .where(eq(customers.id, webUser.customerId))
      .limit(1);

    if (cust && ["under_review", "approved"].includes(cust.onboardingStatus)) {
      return err("Your application has already been submitted", 409);
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  // Generate customer ref
  const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, webUser.tenantId));
  const seq = String(existing.length + 1).padStart(6, "0");
  const customerRef = `CUST-${seq}`;

  // Create customer record
  let customerId = webUser.customerId;

  if (!customerId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customers) as any).values({
      tenantId:           webUser.tenantId,
      customerRef,
      type:               "individual",
      status:             "onboarding",
      onboardingStatus:   "pending",
      riskCategory:       "low",
      firstName:          d.firstName,
      lastName:           d.lastName,
      dateOfBirth:        d.dateOfBirth,
      nationality:        d.nationality.toUpperCase(),
      countryOfResidence: d.countryOfResidence.toUpperCase(),
      occupation:         d.occupation,
      sourceOfFunds:      d.sourceOfFunds,
      email:              webUser.email,
      phone:              webUser.phoneNumber ?? null,
      addressLine1:       d.addressLine1,
      addressLine2:       d.addressLine2 ?? null,
      city:               d.city,
      postCode:           d.postCode,
      country:            d.country.toUpperCase(),
    });

    const [created] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.customerRef, customerRef))
      .limit(1);

    customerId = created.id;

    // Link web user to customer
    await db.update(webUsers).set({ customerId }).where(eq(webUsers.id, userId));
  } else {
    // Update existing customer record
    await db.update(customers).set({
      firstName:          d.firstName,
      lastName:           d.lastName,
      dateOfBirth:        d.dateOfBirth,
      nationality:        d.nationality.toUpperCase(),
      countryOfResidence: d.countryOfResidence.toUpperCase(),
      occupation:         d.occupation,
      sourceOfFunds:      d.sourceOfFunds,
      addressLine1:       d.addressLine1,
      addressLine2:       d.addressLine2 ?? null,
      city:               d.city,
      postCode:           d.postCode,
      country:            d.country.toUpperCase(),
      onboardingStatus:   "pending",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).where(eq(customers.id, customerId));
  }

  // Add document record (metadata only; file upload deferred to Sprint 4 storage provision)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(customerDocuments) as any).values({
    customerId,
    tenantId:       webUser.tenantId,
    documentType:   d.documentType,
    documentNumber: d.documentNumber,
    issuingCountry: d.issuingCountry.toUpperCase(),
    expiryDate:     d.expiryDate,
    status:         "pending",
  });

  if (d.poaDocumentType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId,
      tenantId:     webUser.tenantId,
      documentType: d.poaDocumentType,
      status:       "pending",
    });
  }

  // Advance onboarding status to under_review
  await db
    .update(customers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ onboardingStatus: "under_review", status: "onboarding" } as any)
    .where(eq(customers.id, customerId));

  return ok({ message: "Application submitted successfully", customerId });
}

// GET /api/onboarding — get current onboarding state
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) return unauthorized();

  if (!webUser.customerId) {
    return ok({ status: "not_started", customer: null });
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  return ok({ status: customer?.onboardingStatus ?? "not_started", customer });
}
