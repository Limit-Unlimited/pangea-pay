import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, sarRecords } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  type:        z.enum(["internal", "external"]).default("internal"),
  description: z.string().min(1).max(5000),
  notes:       z.string().max(2000).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/sar
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const records = await db
    .select()
    .from(sarRecords)
    .where(eq(sarRecords.customerId, id))
    .orderBy(desc(sarRecords.createdAt));

  return ok(records);
}

// POST /api/customers/[id]/sar
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  // Generate sequential SAR ref
  const [{ maxRef }] = await db
    .select({ maxRef: sql<string>`MAX(sar_ref)` })
    .from(sarRecords)
    .where(eq(sarRecords.tenantId, session.user.tenantId));

  const nextNum = maxRef ? parseInt(maxRef.replace(/\D/g, ""), 10) + 1 : 1;
  const sarRef = `SAR-${String(nextNum).padStart(6, "0")}`;

  const sarId = randomUUID();
  await (db.insert(sarRecords) as any).values({
    id:          sarId,
    customerId:  id,
    tenantId:    session.user.tenantId,
    sarRef,
    type:        parsed.data.type,
    description: parsed.data.description,
    notes:       parsed.data.notes ?? null,
    createdBy:   session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.sar_created",
    resource:   "sar_record",
    resourceId: sarId,
    newValue:   { customerId: id, sarRef, type: parsed.data.type },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: sarId, sarRef }, 201);
}
