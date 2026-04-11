import { NextRequest, NextResponse } from "next/server";
import { db, customers } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// GET /api/v1/customers/:ref — look up a customer by their customerRef
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const ctx = await requireAuth(req, "customers:read");
  if (ctx instanceof NextResponse) return ctx;

  const { ref } = await params;

  const [customer] = await db
    .select({
      id:               customers.id,
      customerRef:      customers.customerRef,
      type:             customers.type,
      status:           customers.status,
      onboardingStatus: customers.onboardingStatus,
      riskCategory:     customers.riskCategory,
      // Individual
      firstName:        customers.firstName,
      lastName:         customers.lastName,
      dateOfBirth:      customers.dateOfBirth,
      nationality:      customers.nationality,
      countryOfResidence: customers.countryOfResidence,
      // Business
      legalEntityName:  customers.legalEntityName,
      tradingName:      customers.tradingName,
      registrationNumber: customers.registrationNumber,
      incorporationCountry: customers.incorporationCountry,
      // Contact
      email:            customers.email,
      phone:            customers.phone,
      country:          customers.country,
      city:             customers.city,
      // Compliance
      screeningStatus:  customers.screeningStatus,
      createdAt:        customers.createdAt,
    })
    .from(customers)
    .where(and(
      eq(customers.customerRef, ref.toUpperCase()),
      eq(customers.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ data: customer });
}
