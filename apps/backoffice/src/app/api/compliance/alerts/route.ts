import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, complianceAlerts, customers, transactions } from "@pangea/db";
import { eq, and, desc, like, or, count } from "drizzle-orm";
import { ok, unauthorized } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status") ?? "";
  const severity  = searchParams.get("severity") ?? "";
  const search    = searchParams.get("search") ?? "";
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit     = 25;
  const offset    = (page - 1) * limit;

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const conditions = [eq(complianceAlerts.tenantId, tenantId)];
  if (status)   conditions.push(eq(complianceAlerts.status, status as "open" | "under_review" | "cleared" | "escalated" | "closed"));
  if (severity) conditions.push(eq(complianceAlerts.severity, severity as "low" | "medium" | "high" | "critical"));
  if (search)   conditions.push(or(
    like(complianceAlerts.alertRef, `%${search}%`),
    like(complianceAlerts.ruleCode, `%${search}%`),
    like(complianceAlerts.ruleName, `%${search}%`),
  )!);

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:            complianceAlerts.id,
        alertRef:      complianceAlerts.alertRef,
        ruleCode:      complianceAlerts.ruleCode,
        ruleName:      complianceAlerts.ruleName,
        severity:      complianceAlerts.severity,
        status:        complianceAlerts.status,
        customerId:    complianceAlerts.customerId,
        transactionId: complianceAlerts.transactionId,
        reviewedAt:    complianceAlerts.reviewedAt,
        createdAt:     complianceAlerts.createdAt,
        customerName: customers.firstName,
        customerRef:  customers.customerRef,
      })
      .from(complianceAlerts)
      .leftJoin(customers, eq(customers.id, complianceAlerts.customerId))
      .where(where)
      .orderBy(desc(complianceAlerts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(complianceAlerts)
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
    transactionId?: string;
    ruleCode: string;
    ruleName: string;
    severity?: "low" | "medium" | "high" | "critical";
    triggerDetails?: string;
  };

  // Generate sequential ref
  const [{ total }] = await db
    .select({ total: count() })
    .from(complianceAlerts)
    .where(eq(complianceAlerts.tenantId, tenantId));

  const alertRef = `ALT-${String(total + 1).padStart(6, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(complianceAlerts) as any).values({
    id:            randomUUID(),
    tenantId,
    alertRef,
    customerId:    body.customerId,
    transactionId: body.transactionId ?? null,
    ruleCode:      body.ruleCode,
    ruleName:      body.ruleName,
    severity:      body.severity ?? "medium",
    status:        "open",
    triggerDetails: body.triggerDetails ?? null,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "compliance.alert.reviewed",
    resource:   "compliance_alert",
    newValue:   { alertRef, ruleCode: body.ruleCode },
  });

  return ok({ alertRef }, 201);
}
