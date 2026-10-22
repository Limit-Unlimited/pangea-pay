import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customers, beneficiaries, customerScreeningResults, sanctionScreeningHits, sanctionLists, users } from "@pangea/db";
import { screenCustomer, screenBeneficiary, ScreeningError } from "@pangea/sanctions";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

// Only sanctions screening runs against real data so far. PEP screening is
// phase 2; adverse media and internal watchlist have no source yet.
const AVAILABLE_TYPES = ["sanctions"] as const;

const triggerSchema = z.object({
  screeningType: z.enum(["sanctions", "pep", "adverse_media", "internal_watchlist"]).optional(),
  beneficiaryId: z.string().uuid().optional(),   // screen one of the customer's beneficiaries instead
});

type Params = { params: Promise<{ id: string }> };

function parseJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

// GET /api/customers/[id]/screening: every screening result for the
// customer and their beneficiaries, newest first, each with its sanctions
// hits and the decisions made on them
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

  const rows = await db
    .select({
      result:          customerScreeningResults,
      beneficiaryName: beneficiaries.displayName,
      beneficiaryStatus: beneficiaries.status,
    })
    .from(customerScreeningResults)
    .leftJoin(beneficiaries, eq(beneficiaries.id, customerScreeningResults.beneficiaryId))
    .where(eq(customerScreeningResults.customerId, id))
    .orderBy(desc(customerScreeningResults.screenedAt), desc(customerScreeningResults.createdAt));
  const results = rows.map((r) => ({
    ...r.result,
    beneficiaryName:   r.beneficiaryName,
    // A customer can remove a beneficiary; its screenings stay on record.
    beneficiaryRemoved: r.result.beneficiaryId !== null && r.beneficiaryName === null,
    beneficiaryStatus: r.beneficiaryStatus,
  }));

  const hits = results.length
    ? await db
        .select({
          hit:            sanctionScreeningHits,
          listName:       sanctionLists.name,
          deciderFirst:   users.firstName,
          deciderLast:    users.lastName,
        })
        .from(sanctionScreeningHits)
        .leftJoin(sanctionLists, eq(sanctionLists.code, sanctionScreeningHits.listCode))
        .leftJoin(users, eq(users.id, sanctionScreeningHits.decidedBy))
        .where(and(
          eq(sanctionScreeningHits.tenantId, session.user.tenantId),
          inArray(sanctionScreeningHits.screeningResultId, results.map((r) => r.id)),
        ))
        .orderBy(desc(sanctionScreeningHits.score))
    : [];

  return ok(results.map((r) => ({
    ...r,
    details: parseJson(r.matchDetails),
    hits: hits
      .filter((h) => h.hit.screeningResultId === r.id)
      .map((h) => ({
        ...h.hit,
        listName:  h.listName ?? h.hit.listCode,
        decidedByName: h.deciderFirst ? `${h.deciderFirst} ${h.deciderLast ?? ""}`.trim() : null,
      })),
  })));
}

// POST /api/customers/[id]/screening: screen the customer against the sanctions lists
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = triggerSchema.safeParse(body ?? {});
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const requested = parsed.data.screeningType ?? "sanctions";
  if (!(AVAILABLE_TYPES as readonly string[]).includes(requested)) {
    return err(`${requested.replace(/_/g, " ")} screening is not available yet. Only sanctions screening runs at present.`);
  }

  const { beneficiaryId } = parsed.data;
  if (beneficiaryId) {
    const [owned] = await db.select({ id: beneficiaries.id }).from(beneficiaries)
      .where(and(eq(beneficiaries.id, beneficiaryId), eq(beneficiaries.customerId, id), eq(beneficiaries.tenantId, session.user.tenantId)))
      .limit(1);
    if (!owned) return err("Beneficiary not found", 404);
  }

  let result;
  try {
    result = beneficiaryId
      ? await screenBeneficiary({ beneficiaryId, tenantId: session.user.tenantId, userId: session.user.id })
      : await screenCustomer({ customerId: id, tenantId: session.user.tenantId, userId: session.user.id });
  } catch (e) {
    if (e instanceof ScreeningError) return err(e.message, e.message.endsWith("not found") ? 404 : 400);
    throw e;
  }

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.screened",
    resource:   "customer",
    resourceId: id,
    newValue:   {
      provider:           "pangea_sanctions",
      screeningType:      "sanctions",
      beneficiaryId:      beneficiaryId ?? null,
      resultId:           result.resultId,
      overallStatus:      result.status,
      hitCount:           result.hitCount,
      pendingCount:       result.pendingCount,
      carriedCount:       result.carriedCount,
      listsNeedingReview: result.listsNeedingReview.map((l) => l.code),
    },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ overallStatus: result.status, ...result }, 201);
}
