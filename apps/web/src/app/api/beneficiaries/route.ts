import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, webUsers, customers, beneficiaries } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({
  displayName:   z.string().min(1).max(255),
  firstName:     z.string().max(100).optional().nullable(),
  lastName:      z.string().max(100).optional().nullable(),
  bankName:      z.string().max(255).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  iban:          z.string().max(34).optional().nullable(),
  sortCode:      z.string().max(10).optional().nullable(),
  swiftBic:      z.string().max(11).optional().nullable(),
  currency:      z.string().length(3),
  country:       z.string().length(2),
}).refine(
  (d) => d.iban || d.accountNumber,
  { message: "Either IBAN or account number is required" }
);

// GET /api/beneficiaries — list beneficiaries for the logged-in customer
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser?.customerId) return ok([]);

  const rows = await db
    .select()
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.customerId, webUser.customerId),
        eq(beneficiaries.tenantId, webUser.tenantId),
      )
    )
    .orderBy(desc(beneficiaries.createdAt));

  return ok(rows.filter((b) => b.status !== "blocked"));
}

// POST /api/beneficiaries — add a new beneficiary
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  if (!webUser?.customerId) return err("No active customer account", 403);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") return err("Account not yet approved", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const d = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(beneficiaries) as any).values({
    tenantId:      webUser.tenantId,
    customerId:    webUser.customerId,
    displayName:   d.displayName,
    firstName:     d.firstName ?? null,
    lastName:      d.lastName  ?? null,
    bankName:      d.bankName  ?? null,
    accountNumber: d.accountNumber ?? null,
    iban:          d.iban      ?? null,
    sortCode:      d.sortCode  ?? null,
    swiftBic:      d.swiftBic  ?? null,
    currency:      d.currency.toUpperCase(),
    country:       d.country.toUpperCase(),
    status:        "active",
  });

  return ok({ message: "Beneficiary added" }, 201);
}
