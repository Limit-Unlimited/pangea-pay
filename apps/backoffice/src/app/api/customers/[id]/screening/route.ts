import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, customerScreeningResults } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

/**
 * Mock screening adapter.
 * Real provider (ComplyAdvantage / similar) will be integrated in Sprint 7
 * once sandbox credentials are available.
 */
function mockScreen(name: string): { status: "clear" | "match" | "review"; matchDetails: null | string } {
  // Deterministic mock: names containing "test-match" return a match for demo purposes
  if (name.toLowerCase().includes("test-match")) {
    return { status: "match", matchDetails: JSON.stringify({ reason: "Watchlist name similarity — mock result" }) };
  }
  if (name.toLowerCase().includes("test-review")) {
    return { status: "review", matchDetails: JSON.stringify({ reason: "PEP indicator — mock result" }) };
  }
  return { status: "clear", matchDetails: null };
}

const triggerSchema = z.object({
  screeningType: z.enum(["sanctions", "pep", "adverse_media", "internal_watchlist"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/screening — list all screening results
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

  const results = await db
    .select()
    .from(customerScreeningResults)
    .where(eq(customerScreeningResults.customerId, id))
    .orderBy(desc(customerScreeningResults.screenedAt));

  return ok(results);
}

// POST /api/customers/[id]/screening — trigger a screening run
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({
      id:             customers.id,
      firstName:      customers.firstName,
      lastName:       customers.lastName,
      legalEntityName: customers.legalEntityName,
      type:           customers.type,
    })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = triggerSchema.safeParse(body ?? {});
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const screeningTypes: Array<"sanctions" | "pep" | "adverse_media" | "internal_watchlist"> = parsed.data.screeningType
    ? [parsed.data.screeningType]
    : ["sanctions", "pep", "adverse_media", "internal_watchlist"];

  const name = customer.type === "individual"
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    : (customer.legalEntityName ?? "");

  const results: Array<{ id: string; screeningType: string; status: string }> = [];

  for (const screeningType of screeningTypes) {
    const { status, matchDetails } = mockScreen(name);
    const resultId = randomUUID();

    await (db.insert(customerScreeningResults) as any).values({
      id:            resultId,
      customerId:    id,
      tenantId:      session.user.tenantId,
      provider:      "mock",
      screeningType,
      status,
      matchDetails:  matchDetails ?? null,
      screenedBy:    null, // automated
    });

    results.push({ id: resultId, screeningType, status });
  }

  // Roll up overall screening status: match > review > pending > clear
  const overallStatus =
    results.some((r) => r.status === "match")  ? "match"  :
    results.some((r) => r.status === "review") ? "review" : "clear";

  await db.update(customers).set({ screeningStatus: overallStatus as any }).where(eq(customers.id, id));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.screened",
    resource:   "customer",
    resourceId: id,
    newValue:   { provider: "mock", overallStatus, results },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ overallStatus, results }, 201);
}
