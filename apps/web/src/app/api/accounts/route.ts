import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db, webUsers, accounts, customers, currencies } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

// GET /api/accounts — get accounts for the logged-in customer
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser?.customerId) return ok([]);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved") return ok([]);

  const rows = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.customerId, webUser.customerId),
        eq(accounts.tenantId, webUser.tenantId)
      )
    )
    .orderBy(desc(accounts.createdAt));

  return ok(rows);
}

const openSchema = z.object({
  currency:    z.string().length(3).toUpperCase(),
  accountType: z.enum(["current", "wallet"]).default("current"),
});

// POST /api/accounts — open a new account
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser?.customerId) return err("No customer profile found", 400);

  const [customer] = await db
    .select({ onboardingStatus: customers.onboardingStatus })
    .from(customers)
    .where(eq(customers.id, webUser.customerId))
    .limit(1);

  if (customer?.onboardingStatus !== "approved")
    return err("Your account must be verified before opening accounts", 403);

  const body = await req.json().catch(() => null);
  const parsed = openSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { currency, accountType } = parsed.data;

  // Verify the currency is active
  const [cur] = await db
    .select({ code: currencies.code })
    .from(currencies)
    .where(and(eq(currencies.code, currency), eq(currencies.status, "active")))
    .limit(1);

  if (!cur) return err("Currency not available", 400);

  // Prevent duplicate currency accounts
  const [existing] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        eq(accounts.customerId, webUser.customerId),
        eq(accounts.currency, currency),
        // Allow re-opening only if previous was closed
      )
    )
    .limit(1);

  if (existing) return err(`You already have a ${currency} account`, 409);

  // Generate account number
  const all = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.tenantId, webUser.tenantId));
  const seq = String(all.length + 1).padStart(6, "0");
  const accountNumber = `ACC-${seq}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(accounts) as any).values({
    tenantId:    webUser.tenantId,
    customerId:  webUser.customerId,
    accountNumber,
    accountType,
    currency,
    status:      "pending",
    openDate:    new Date().toISOString().split("T")[0],
  });

  const [created] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.accountNumber, accountNumber))
    .limit(1);

  return ok(created, 201);
}
