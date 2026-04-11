import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, customers, beneficiaries } from "@pangea/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";
import { randomUUID } from "crypto";

const createSchema = z.object({
  customerRef:   z.string().min(1),
  displayName:   z.string().min(1).max(255),
  firstName:     z.string().max(100).optional().nullable(),
  lastName:      z.string().max(100).optional().nullable(),
  bankName:      z.string().max(255).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  iban:          z.string().max(34).optional().nullable(),
  sortCode:      z.string().max(10).optional().nullable(),
  swiftBic:      z.string().max(11).optional().nullable(),
  currency:      z.string().length(3),
  country:       z.string().length(2),
}).refine(
  (d) => d.iban || d.accountNumber,
  { message: "Either iban or account_number is required" },
);

// GET /api/v1/beneficiaries?customerRef=CUST-000001
export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req, "beneficiaries:read");
  if (ctx instanceof NextResponse) return ctx;

  const customerRef = req.nextUrl.searchParams.get("customerRef");
  if (!customerRef) {
    return NextResponse.json({ error: "customerRef query parameter is required" }, { status: 400 });
  }

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(
      eq(customers.customerRef, customerRef.toUpperCase()),
      eq(customers.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(beneficiaries)
    .where(and(
      eq(beneficiaries.customerId, customer.id),
      eq(beneficiaries.tenantId, ctx.tenantId),
    ))
    .orderBy(desc(beneficiaries.createdAt));

  return NextResponse.json({ data: rows.filter((b) => b.status !== "blocked") });
}

// POST /api/v1/beneficiaries
export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req, "beneficiaries:write");
  if (ctx instanceof NextResponse) return ctx;

  const idempotent = await checkIdempotency(req, ctx.consumerId, ctx.tenantId, "POST /api/v1/beneficiaries");
  if (idempotent) return idempotent;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const d = parsed.data;

  const [customer] = await db
    .select({ id: customers.id, onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(and(
      eq(customers.customerRef, d.customerRef.toUpperCase()),
      eq(customers.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (customer.onboardingStatus !== "approved") {
    return NextResponse.json({ error: "Customer account is not approved" }, { status: 422 });
  }

  const id = randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(beneficiaries) as any).values({
    id,
    tenantId:      ctx.tenantId,
    customerId:    customer.id,
    displayName:   d.displayName,
    firstName:     d.firstName  ?? null,
    lastName:      d.lastName   ?? null,
    bankName:      d.bankName   ?? null,
    accountNumber: d.accountNumber ?? null,
    iban:          d.iban       ?? null,
    sortCode:      d.sortCode   ?? null,
    swiftBic:      d.swiftBic   ?? null,
    currency:      d.currency.toUpperCase(),
    country:       d.country.toUpperCase(),
    status:        "active",
  });

  const responseBody = JSON.stringify({ data: { id } });
  await saveIdempotency(ctx.consumerId, ctx.tenantId, "POST /api/v1/beneficiaries", req.headers.get("idempotency-key") ?? id, 201, responseBody);

  return new NextResponse(responseBody, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
