import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, complianceCases, customers } from "@pangea/db";
import { eq, and, desc, like, or, count } from "drizzle-orm";
import { ok, unauthorized, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const search   = searchParams.get("search") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit    = 25;
  const offset   = (page - 1) * limit;

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const conditions = [eq(complianceCases.tenantId, tenantId)];
  if (status)   conditions.push(eq(complianceCases.status, status as "open" | "under_investigation" | "closed" | "escalated_to_sar"));
  if (priority) conditions.push(eq(complianceCases.priority, priority as "low" | "medium" | "high"));
  if (search)   conditions.push(or(
    like(complianceCases.caseRef, `%${search}%`),
    like(complianceCases.title, `%${search}%`),
  )!);

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:          complianceCases.id,
        caseRef:     complianceCases.caseRef,
        title:       complianceCases.title,
        status:      complianceCases.status,
        priority:    complianceCases.priority,
        customerId:  complianceCases.customerId,
        assignedTo:  complianceCases.assignedTo,
        dueDate:     complianceCases.dueDate,
        openedAt:    complianceCases.openedAt,
        closedAt:    complianceCases.closedAt,
        customerName: customers.firstName,
        customerRef:  customers.customerRef,
      })
      .from(complianceCases)
      .leftJoin(customers, eq(customers.id, complianceCases.customerId))
      .where(where)
      .orderBy(desc(complianceCases.openedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(complianceCases)
      .where(where),
  ]);

  return ok({ rows, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const body = await req.json() as {
    customerId: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    assignedTo?: string;
    dueDate?: string;
  };

  if (!body.customerId || !body.title) {
    return err("customerId and title are required");
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(complianceCases)
    .where(eq(complianceCases.tenantId, tenantId));

  const caseRef = `CASE-${String(total + 1).padStart(6, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(complianceCases) as any).values({
    id:          randomUUID(),
    tenantId,
    caseRef,
    customerId:  body.customerId,
    title:       body.title,
    description: body.description ?? null,
    status:      "open",
    priority:    body.priority ?? "medium",
    assignedTo:  body.assignedTo ?? null,
    dueDate:     body.dueDate ? new Date(body.dueDate) : null,
    openedBy:    session.user.id,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "compliance.case.created",
    resource:   "compliance_case",
    newValue:   { caseRef, title: body.title },
  });

  return ok({ caseRef }, 201);
}
