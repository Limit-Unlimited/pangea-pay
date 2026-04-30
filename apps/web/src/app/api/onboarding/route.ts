import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers, customers, customerDocuments, webUserCustomerLinks } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { checkVpn, getClientIp, vpnBlockMessage } from "@/lib/vpn/detect";
import { resolveCustomerId } from "@/lib/auth/context";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const individualSchema = z.object({
  type: z.literal("individual"),

  firstName:           z.string().min(1).max(100),
  lastName:            z.string().min(1).max(100),
  dateOfBirth:         z.string().min(1),
  nationality:         z.string().length(2),
  countryOfResidence:  z.string().length(2),
  occupation:          z.string().min(1).max(150),
  sourceOfFunds:       z.string().min(1).max(150),

  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city:         z.string().min(1).max(100),
  postCode:     z.string().min(1).max(20),
  country:      z.string().length(2),

  documentType:   z.enum(["passport", "national_id", "driving_licence"]),
  documentNumber: z.string().min(1).max(100),
  issuingCountry: z.string().length(2),
  expiryDate:     z.string().min(1),

  poaDocumentType: z.enum(["utility_bill", "bank_statement", "proof_of_address"]).optional(),
});

const businessSchema = z.object({
  type: z.literal("business"),

  legalEntityName:      z.string().min(1).max(255),
  tradingName:          z.string().max(255).optional().nullable(),
  registrationNumber:   z.string().min(1).max(100),
  incorporationCountry: z.string().length(2),
  incorporationDate:    z.string().min(1),
  businessType:         z.string().min(1).max(100),
  businessSector:       z.string().min(1).max(150),

  addressLine1:  z.string().min(1).max(255),
  addressLine2:  z.string().max(255).optional().nullable(),
  city:          z.string().min(1).max(100),
  postCode:      z.string().min(1).max(20),
  country:       z.string().length(2),
  sourceOfFunds: z.string().min(1).max(150),

  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  dateOfBirth: z.string().min(1),
  nationality: z.string().length(2),
  occupation:  z.string().min(1).max(150),

  incorporationDocType: z.enum(["certificate_of_incorporation", "company_registration"]).optional(),
  poaDocType:           z.enum(["utility_bill", "bank_statement", "proof_of_address"]).optional(),
});

const schema = z.discriminatedUnion("type", [individualSchema, businessSchema]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function nextCustomerRef(tenantId: string): Promise<string> {
  const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, tenantId));
  return `CUST-${String(existing.length + 1).padStart(6, "0")}`;
}

// Determine the target customer for this submission:
//   - If the active customer is pending/rejected → update it (resubmission)
//   - Otherwise (approved, or no customer yet) → create a new one
async function resolveTargetCustomer(
  activeCustomerId: string | null,
): Promise<{ existingId: string | null; status: string | null }> {
  if (!activeCustomerId) return { existingId: null, status: null };

  const [cust] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, activeCustomerId))
    .limit(1);

  if (!cust) return { existingId: null, status: null };

  // Only re-use the existing record for pending/rejected — treat approved as "add new"
  if (["pending", "rejected"].includes(cust.onboardingStatus)) {
    return { existingId: activeCustomerId, status: cust.onboardingStatus };
  }

  if (cust.onboardingStatus === "under_review") {
    return { existingId: "BLOCK", status: "under_review" };
  }

  return { existingId: null, status: cust.onboardingStatus };
}

// Link a web user to a customer and set as their active context.
// isPrimary = true only when this is the very first customer for this user.
async function linkCustomer(
  webUserId:    string,
  customerId:   string,
  isPrimary:    boolean,
) {
  // Upsert junction row — re-activates if the user was previously removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(webUserCustomerLinks) as any)
    .values({ userId: webUserId, customerId, role: "owner", isPrimary, status: "active" })
    .onDuplicateKeyUpdate({ set: { status: "active" } });

  // Update active context + primary link if first customer
  const update: Record<string, unknown> = { activeCustomerId: customerId };
  if (isPrimary) update.customerId = customerId;
  await db.update(webUsers).set(update as never).where(eq(webUsers.id, webUserId));
}

// ---------------------------------------------------------------------------
// POST /api/onboarding
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const vpn = await checkVpn(getClientIp(req));
  if (vpn.blocked) return err(vpnBlockMessage(), 403);

  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const activeCustomerId = resolveCustomerId(webUser);
  const { existingId, status } = await resolveTargetCustomer(activeCustomerId);

  if (status === "under_review") {
    return err("Your application is already under review", 409);
  }

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  if (d.type === "individual") return handleIndividual(webUser, d, existingId);
  return handleBusiness(webUser, d, existingId);
}

// ---------------------------------------------------------------------------
// Individual submission
// ---------------------------------------------------------------------------

async function handleIndividual(
  webUser:    { id: string; tenantId: string; email: string; phoneNumber?: string | null; customerId: string | null },
  d:          z.infer<typeof individualSchema>,
  existingId: string | null,
) {
  let customerId = existingId;

  if (!customerId) {
    const customerRef = await nextCustomerRef(webUser.tenantId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customers) as any).values({
      tenantId: webUser.tenantId, customerRef,
      type: "individual", status: "onboarding", onboardingStatus: "pending", riskCategory: "low",
      firstName: d.firstName, lastName: d.lastName, dateOfBirth: d.dateOfBirth,
      nationality: d.nationality.toUpperCase(), countryOfResidence: d.countryOfResidence.toUpperCase(),
      occupation: d.occupation, sourceOfFunds: d.sourceOfFunds,
      email: webUser.email, phone: webUser.phoneNumber ?? null,
      addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
      city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
    });

    const [created] = await db.select({ id: customers.id }).from(customers)
      .where(eq(customers.customerRef, customerRef)).limit(1);
    customerId = created.id;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(customers) as any).set({
      firstName: d.firstName, lastName: d.lastName, dateOfBirth: d.dateOfBirth,
      nationality: d.nationality.toUpperCase(), countryOfResidence: d.countryOfResidence.toUpperCase(),
      occupation: d.occupation, sourceOfFunds: d.sourceOfFunds,
      addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
      city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
      onboardingStatus: "pending",
    }).where(eq(customers.id, customerId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(customerDocuments) as any).values({
    customerId, tenantId: webUser.tenantId,
    documentType: d.documentType, documentNumber: d.documentNumber,
    issuingCountry: d.issuingCountry.toUpperCase(), expiryDate: d.expiryDate, status: "pending",
  });
  if (d.poaDocumentType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId, documentType: d.poaDocumentType, status: "pending",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(customers) as any)
    .set({ onboardingStatus: "under_review", status: "onboarding" })
    .where(eq(customers.id, customerId));

  const isPrimary = !webUser.customerId;
  await linkCustomer(webUser.id, customerId, isPrimary);

  return ok({ message: "Application submitted successfully", customerId });
}

// ---------------------------------------------------------------------------
// Business submission
// ---------------------------------------------------------------------------

async function handleBusiness(
  webUser:    { id: string; tenantId: string; email: string; phoneNumber?: string | null; customerId: string | null },
  d:          z.infer<typeof businessSchema>,
  existingId: string | null,
) {
  let customerId = existingId;

  if (!customerId) {
    const customerRef = await nextCustomerRef(webUser.tenantId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customers) as any).values({
      tenantId: webUser.tenantId, customerRef,
      type: "business", status: "onboarding", onboardingStatus: "pending", riskCategory: "low",
      legalEntityName: d.legalEntityName, tradingName: d.tradingName ?? null,
      registrationNumber: d.registrationNumber,
      incorporationCountry: d.incorporationCountry.toUpperCase(),
      incorporationDate: d.incorporationDate,
      businessType: d.businessType, businessSector: d.businessSector,
      firstName: d.firstName, lastName: d.lastName,
      dateOfBirth: d.dateOfBirth, nationality: d.nationality.toUpperCase(),
      occupation: d.occupation, sourceOfFunds: d.sourceOfFunds,
      email: webUser.email, phone: webUser.phoneNumber ?? null,
      addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
      city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
    });

    const [created] = await db.select({ id: customers.id }).from(customers)
      .where(eq(customers.customerRef, customerRef)).limit(1);
    customerId = created.id;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(customers) as any).set({
      type: "business",
      legalEntityName: d.legalEntityName, tradingName: d.tradingName ?? null,
      registrationNumber: d.registrationNumber,
      incorporationCountry: d.incorporationCountry.toUpperCase(),
      incorporationDate: d.incorporationDate,
      businessType: d.businessType, businessSector: d.businessSector,
      firstName: d.firstName, lastName: d.lastName,
      dateOfBirth: d.dateOfBirth, nationality: d.nationality.toUpperCase(),
      occupation: d.occupation, sourceOfFunds: d.sourceOfFunds,
      addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
      city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
      onboardingStatus: "pending",
    }).where(eq(customers.id, customerId));
  }

  if (d.incorporationDocType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId, documentType: d.incorporationDocType, status: "pending",
    });
  }
  if (d.poaDocType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId, documentType: d.poaDocType, status: "pending",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(customers) as any)
    .set({ onboardingStatus: "under_review", status: "onboarding" })
    .where(eq(customers.id, customerId));

  const isPrimary = !webUser.customerId;
  await linkCustomer(webUser.id, customerId, isPrimary);

  return ok({ message: "Business application submitted successfully", customerId });
}

// ---------------------------------------------------------------------------
// GET /api/onboarding — current onboarding state for active context
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser) return unauthorized();

  const customerId = resolveCustomerId(webUser);
  if (!customerId) return ok({ status: "not_started", customer: null });

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return ok({ status: customer?.onboardingStatus ?? "not_started", customer });
}
