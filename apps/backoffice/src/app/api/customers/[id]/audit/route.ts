import { NextRequest } from "next/server";
import { eq, and, desc, count } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, auditLogs } from "@pangea/db";
import { ok, err, unauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/audit
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 25));

  const where = and(eq(auditLogs.resourceId, id), eq(auditLogs.tenantId, session.user.tenantId));

  const [{ total }] = await db.select({ total: count() }).from(auditLogs).where(where);

  const logs = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return ok({ data: logs, total, page, limit, pages: Math.ceil(total / limit) });
}
