import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, like, desc, count, sql, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, tenants } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  type: z.enum(["individual", "business"]),

  // Individual
  firstName:          z.string().min(1).max(100).optional(),
  lastName:           z.string().min(1).max(100).optional(),
  dateOfBirth:        z.string().optional(),
  nationality:        z.string().length(2).optional(),
  countryOfResidence: z.string().length(2).optional(),
  occupation:         z.string().max(150).optional(),
  employerName:       z.string().max(200).optional(),

  // Business
  legalEntityName:      z.string().min(1).max(255).optional(),
  tradingName:          z.string().max(255).optional(),
  registrationNumber:   z.string().max(100).optional(),
  incorporationCountry: z.string().length(2).optional(),
  incorporationDate:    z.string().optional(),
  businessType:         z.string().max(100).optional(),
  businessSector:       z.string().max(150).optional(),

  // Shared
  email:        z.string().email().optional(),
  phone:        z.string().max(30).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city:         z.string().max(100).optional(),
  postCode:     z.string().max(20).optional(),
  country:      z.string().length(2).optional(),
  sourceOfFunds: z.string().max(150).optional(),
  segment:      z.string().max(100).optional(),
});

// GET /api/customers
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page    = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit   = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const search  = searchParams.get("q") ?? "";
  const status  = searchParams.get("status") ?? "";
  const type    = searchParams.get("type") ?? "";
  const risk    = searchParams.get("risk") ?? "";
  const onboarding = searchParams.get("onboarding") ?? "";

  const conditions = [eq(customers.tenantId, session.user.tenantId)];

  if (search) {
    conditions.push(
      sql`(
        ${customers.firstName} LIKE ${`%${search}%`} OR
        ${customers.lastName} LIKE ${`%${search}%`} OR
        ${customers.legalEntityName} LIKE ${`%${search}%`} OR
        ${customers.email} LIKE ${`%${search}%`} OR
        ${customers.customerRef} LIKE ${`%${search}%`}
      )`
    );
  }
  if (status)    conditions.push(eq(customers.status, status as any));
  if (type)      conditions.push(eq(customers.type, type as any));
  if (risk)      conditions.push(eq(customers.riskCategory, risk as any));
  if (onboarding) conditions.push(eq(customers.onboardingStatus, onboarding as any));

  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(customers).where(where);

  const rows = await db
    .select({
      id:               customers.id,
      customerRef:      customers.customerRef,
      type:             customers.type,
      status:           customers.status,
      onboardingStatus: customers.onboardingStatus,
      riskCategory:     customers.riskCategory,
      screeningStatus:  customers.screeningStatus,
      isBlacklisted:    customers.isBlacklisted,
      firstName:        customers.firstName,
      lastName:         customers.lastName,
      legalEntityName:  customers.legalEntityName,
      email:            customers.email,
      country:          customers.country,
      createdAt:        customers.createdAt,
    })
    .from(customers)
    .where(where)
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const data = parsed.data;

  if (data.type === "individual" && (!data.firstName || !data.lastName)) {
    return err("First name and last name are required for individual customers.");
  }
  if (data.type === "business" && !data.legalEntityName) {
    return err("Legal entity name is required for business customers.");
  }

  // Generate sequential customer ref
  const [{ maxRef }] = await db
    .select({ maxRef: sql<string>`MAX(customer_ref)` })
    .from(customers)
    .where(eq(customers.tenantId, session.user.tenantId));

  const nextNum = maxRef
    ? parseInt(maxRef.replace(/\D/g, ""), 10) + 1
    : 1;
  const customerRef = `CUST-${String(nextNum).padStart(6, "0")}`;

  const customerId = randomUUID();
  await (db.insert(customers) as any).values({
    id:           customerId,
    tenantId:     session.user.tenantId,
    customerRef,
    type:         data.type,
    status:       "prospect",
    onboardingStatus: "pending",
    riskCategory: "low",

    firstName:           data.firstName ?? null,
    lastName:            data.lastName ?? null,
    dateOfBirth:         data.dateOfBirth ?? null,
    nationality:         data.nationality ?? null,
    countryOfResidence:  data.countryOfResidence ?? null,
    occupation:          data.occupation ?? null,
    employerName:        data.employerName ?? null,

    legalEntityName:      data.legalEntityName ?? null,
    tradingName:          data.tradingName ?? null,
    registrationNumber:   data.registrationNumber ?? null,
    incorporationCountry: data.incorporationCountry ?? null,
    incorporationDate:    data.incorporationDate ?? null,
    businessType:         data.businessType ?? null,
    businessSector:       data.businessSector ?? null,

    email:         data.email ?? null,
    phone:         data.phone ?? null,
    addressLine1:  data.addressLine1 ?? null,
    addressLine2:  data.addressLine2 ?? null,
    city:          data.city ?? null,
    postCode:      data.postCode ?? null,
    country:       data.country ?? null,
    sourceOfFunds: data.sourceOfFunds ?? null,
    segment:       data.segment ?? null,

    createdBy: session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.created",
    resource:   "customer",
    resourceId: customerId,
    newValue:   { customerRef, type: data.type },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: customerId, customerRef }, 201);
}
