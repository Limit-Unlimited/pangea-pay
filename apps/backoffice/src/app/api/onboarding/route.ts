import { NextRequest } from "next/server";
import { eq, and, desc, count, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers } from "@pangea/db";
import { ok, unauthorized } from "@/lib/api/response";

// GET /api/onboarding — queue of customers requiring KYC action
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page           = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit          = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const onboardingStatus = searchParams.get("status") ?? "";
  const type           = searchParams.get("type") ?? "";

  const conditions = [
    eq(customers.tenantId, session.user.tenantId),
    // Only show customers in onboarding lifecycle
    or(
      eq(customers.status, "prospect"),
      eq(customers.status, "onboarding")
    )!,
  ];

  if (onboardingStatus) conditions.push(eq(customers.onboardingStatus, onboardingStatus as any));
  if (type)            conditions.push(eq(customers.type, type as any));

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
      firstName:        customers.firstName,
      lastName:         customers.lastName,
      legalEntityName:  customers.legalEntityName,
      email:            customers.email,
      country:          customers.country,
      nextReviewDue:    customers.nextReviewDue,
      createdAt:        customers.createdAt,
    })
    .from(customers)
    .where(where)
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}
