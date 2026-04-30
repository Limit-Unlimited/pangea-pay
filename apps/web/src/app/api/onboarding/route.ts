import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers, customers, customerDocuments } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { checkVpn, getClientIp, vpnBlockMessage } from "@/lib/vpn/detect";

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

  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city:         z.string().min(1).max(100),
  postCode:     z.string().min(1).max(20),
  country:      z.string().length(2),
  sourceOfFunds: z.string().min(1).max(150),

  // Authorised signatory personal details
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  dateOfBirth: z.string().min(1),
  nationality: z.string().length(2),
  occupation:  z.string().min(1).max(150),  // job title stored in occupation field

  incorporationDocType: z.enum(["certificate_of_incorporation", "company_registration"]).optional(),
  poaDocType:           z.enum(["utility_bill", "bank_statement", "proof_of_address"]).optional(),
});

const schema = z.discriminatedUnion("type", [individualSchema, businessSchema]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function alreadySubmitted(webUser: { customerId: string | null }): Promise<boolean> {
  if (!webUser.customerId) return false;
  const [cust] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId!))
    .limit(1);
  return !!cust && ["under_review", "approved"].includes(cust.onboardingStatus);
}

async function nextCustomerRef(tenantId: string): Promise<string> {
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.tenantId, tenantId));
  return `CUST-${String(existing.length + 1).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// POST /api/onboarding
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const vpn = await checkVpn(getClientIp(req));
  if (vpn.blocked) return err(vpnBlockMessage(), 403);

  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) return unauthorized();
  if (await alreadySubmitted(webUser)) {
    return err("Your application has already been submitted", 409);
  }

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  if (d.type === "individual") {
    return handleIndividual(webUser, d);
  }
  return handleBusiness(webUser, d);
}

// ---------------------------------------------------------------------------
// Individual submission
// ---------------------------------------------------------------------------

async function handleIndividual(
  webUser: { id: string; tenantId: string; email: string; phoneNumber?: string | null; customerId: string | null },
  d: z.infer<typeof individualSchema>,
) {
  const customerRef = await nextCustomerRef(webUser.tenantId);
  let customerId    = webUser.customerId;

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
    await db.update(webUsers).set({ customerId }).where(eq(webUsers.id, webUser.id));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(customers) as any)
      .set({
        firstName: d.firstName, lastName: d.lastName, dateOfBirth: d.dateOfBirth,
        nationality: d.nationality.toUpperCase(), countryOfResidence: d.countryOfResidence.toUpperCase(),
        occupation: d.occupation, sourceOfFunds: d.sourceOfFunds,
        addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
        city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
        onboardingStatus: "pending",
      })
      .where(eq(customers.id, customerId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(customerDocuments) as any).values({
    customerId, tenantId: webUser.tenantId,
    documentType: d.documentType, documentNumber: d.documentNumber,
    issuingCountry: d.issuingCountry.toUpperCase(), expiryDate: d.expiryDate,
    status: "pending",
  });

  if (d.poaDocumentType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId,
      documentType: d.poaDocumentType, status: "pending",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(customers) as any)
    .set({ onboardingStatus: "under_review", status: "onboarding" })
    .where(eq(customers.id, customerId));

  return ok({ message: "Application submitted successfully", customerId });
}

// ---------------------------------------------------------------------------
// Business submission
// ---------------------------------------------------------------------------

async function handleBusiness(
  webUser: { id: string; tenantId: string; email: string; phoneNumber?: string | null; customerId: string | null },
  d: z.infer<typeof businessSchema>,
) {
  const customerRef = await nextCustomerRef(webUser.tenantId);
  let customerId    = webUser.customerId;

  if (!customerId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customers) as any).values({
      tenantId:             webUser.tenantId,
      customerRef,
      type:                 "business",
      status:               "onboarding",
      onboardingStatus:     "pending",
      riskCategory:         "low",

      // Business fields
      legalEntityName:      d.legalEntityName,
      tradingName:          d.tradingName ?? null,
      registrationNumber:   d.registrationNumber,
      incorporationCountry: d.incorporationCountry.toUpperCase(),
      incorporationDate:    d.incorporationDate,
      businessType:         d.businessType,
      businessSector:       d.businessSector,

      // Authorised signatory stored in individual fields
      firstName:   d.firstName,
      lastName:    d.lastName,
      dateOfBirth: d.dateOfBirth,
      nationality: d.nationality.toUpperCase(),
      occupation:  d.occupation,

      // Shared
      email:        webUser.email,
      phone:        webUser.phoneNumber ?? null,
      sourceOfFunds: d.sourceOfFunds,
      addressLine1:  d.addressLine1,
      addressLine2:  d.addressLine2 ?? null,
      city:          d.city,
      postCode:      d.postCode,
      country:       d.country.toUpperCase(),
    });

    const [created] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.customerRef, customerRef))
      .limit(1);

    customerId = created.id;
    await db.update(webUsers).set({ customerId }).where(eq(webUsers.id, webUser.id));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.update(customers) as any)
      .set({
        type:                 "business",
        legalEntityName:      d.legalEntityName,
        tradingName:          d.tradingName ?? null,
        registrationNumber:   d.registrationNumber,
        incorporationCountry: d.incorporationCountry.toUpperCase(),
        incorporationDate:    d.incorporationDate,
        businessType:         d.businessType,
        businessSector:       d.businessSector,
        firstName:   d.firstName, lastName: d.lastName,
        dateOfBirth: d.dateOfBirth, nationality: d.nationality.toUpperCase(),
        occupation:  d.occupation, sourceOfFunds: d.sourceOfFunds,
        addressLine1: d.addressLine1, addressLine2: d.addressLine2 ?? null,
        city: d.city, postCode: d.postCode, country: d.country.toUpperCase(),
        onboardingStatus: "pending",
      })
      .where(eq(customers.id, customerId));
  }

  // Proof of incorporation
  if (d.incorporationDocType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId,
      documentType: d.incorporationDocType, status: "pending",
    });
  }

  // Proof of registered address
  if (d.poaDocType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(customerDocuments) as any).values({
      customerId, tenantId: webUser.tenantId,
      documentType: d.poaDocType, status: "pending",
    });
  }

  // Advance to under_review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(customers) as any)
    .set({ onboardingStatus: "under_review", status: "onboarding" })
    .where(eq(customers.id, customerId));

  return ok({ message: "Business application submitted successfully", customerId });
}

// ---------------------------------------------------------------------------
// GET /api/onboarding — current onboarding state
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) return unauthorized();
  if (!webUser.customerId) return ok({ status: "not_started", customer: null });

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  return ok({ status: customer?.onboardingStatus ?? "not_started", customer });
}
