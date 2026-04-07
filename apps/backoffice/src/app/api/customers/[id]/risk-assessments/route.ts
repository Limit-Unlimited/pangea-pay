import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, customerRiskAssessments } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  riskCategory:  z.enum(["low", "medium", "high"]),
  score:         z.number().int().min(0).max(100).optional(),
  notes:         z.string().max(2000).optional(),
  nextReviewDue: z.string().optional(), // ISO date string
});

// Review cycle defaults (months) per risk category
const REVIEW_MONTHS: Record<string, number> = { low: 24, medium: 18, high: 6 };

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/risk-assessments
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

  const assessments = await db
    .select()
    .from(customerRiskAssessments)
    .where(eq(customerRiskAssessments.customerId, id))
    .orderBy(desc(customerRiskAssessments.createdAt));

  return ok(assessments);
}

// POST /api/customers/[id]/risk-assessments
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [existing] = await db
    .select({ id: customers.id, riskCategory: customers.riskCategory })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!existing) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { riskCategory, score, notes, nextReviewDue } = parsed.data;

  // Calculate default next review date if not provided
  const reviewDate = nextReviewDue
    ? new Date(nextReviewDue)
    : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + REVIEW_MONTHS[riskCategory]!);
        return d;
      })();

  const assessmentId = randomUUID();
  await (db.insert(customerRiskAssessments) as any).values({
    id:            assessmentId,
    customerId:    id,
    tenantId:      session.user.tenantId,
    riskCategory,
    score:         score ?? null,
    notes:         notes ?? null,
    nextReviewDue: reviewDate,
    assessedBy:    session.user.id,
  });

  // Update customer risk category and next review date
  await db
    .update(customers)
    .set({ riskCategory, nextReviewDue: reviewDate })
    .where(eq(customers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.risk_assessed",
    resource:   "customer",
    resourceId: id,
    oldValue:   { riskCategory: existing.riskCategory },
    newValue:   { riskCategory, score: score ?? null },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: assessmentId, riskCategory, nextReviewDue: reviewDate.toISOString().split("T")[0]! }, 201);
}
