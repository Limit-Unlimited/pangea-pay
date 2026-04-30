import { NextRequest } from "next/server";
import { eq, and, or, like, ne } from "drizzle-orm";
import { db, webUsers, customers, accounts } from "@pangea/db";
import { auth } from "@/auth";
import { ok, unauthorized } from "@/lib/api/response";

// GET /api/accounts/search?q=<query>
// Returns active Pangea accounts matching name, email prefix, or account number.
// Excludes the requesting customer's own accounts.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return ok([]);

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);

  if (!webUser) return unauthorized();

  const pattern = `%${q}%`;

  const rows = await db
    .select({
      accountNumber:   accounts.accountNumber,
      currency:        accounts.currency,
      firstName:       customers.firstName,
      lastName:        customers.lastName,
      legalEntityName: customers.legalEntityName,
      type:            customers.type,
    })
    .from(accounts)
    .innerJoin(customers, eq(accounts.customerId, customers.id))
    .where(
      and(
        eq(accounts.tenantId, webUser.tenantId),
        eq(accounts.status, "active"),
        webUser.customerId ? ne(accounts.customerId, webUser.customerId) : undefined,
        or(
          like(accounts.accountNumber, pattern),
          like(customers.firstName,    pattern),
          like(customers.lastName,     pattern),
          like(customers.legalEntityName, pattern),
          like(customers.email, `${q}%`), // email: prefix-only match for privacy
        ),
      ),
    )
    .limit(6);

  return ok(
    rows.map((r) => ({
      accountNumber: r.accountNumber,
      currency:      r.currency,
      displayName:
        r.type === "business" && r.legalEntityName
          ? r.legalEntityName
          : [r.firstName, r.lastName].filter(Boolean).join(" ") || "Pangea customer",
    })),
  );
}
