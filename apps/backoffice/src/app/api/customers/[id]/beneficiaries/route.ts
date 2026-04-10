import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, beneficiaries } from "@pangea/db";
import { ok, unauthorized, notFound } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/beneficiaries
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return notFound("Customer");

  const rows = await db
    .select()
    .from(beneficiaries)
    .where(and(eq(beneficiaries.customerId, id), eq(beneficiaries.tenantId, session.user.tenantId)))
    .orderBy(desc(beneficiaries.createdAt));

  return ok(rows);
}
