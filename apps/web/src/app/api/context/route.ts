import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, webUsers, webUserCustomerLinks } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";

const schema = z.object({ customerId: z.string().uuid() });

// POST /api/context — switch the active customer context for the logged-in user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid request");

  const { customerId } = parsed.data;
  const userId         = session.user.id;

  // Verify access via junction table
  const [link] = await db
    .select({ id: webUserCustomerLinks.id })
    .from(webUserCustomerLinks)
    .where(
      and(
        eq(webUserCustomerLinks.userId,      userId),
        eq(webUserCustomerLinks.customerId,  customerId),
        eq(webUserCustomerLinks.status,      "active"),
      ),
    )
    .limit(1);

  if (!link) return err("You do not have access to this account", 403);

  await db
    .update(webUsers)
    .set({ activeCustomerId: customerId })
    .where(eq(webUsers.id, userId));

  return ok({ activeCustomerId: customerId });
}

// GET /api/context — return all linked customers for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const links = await db
    .select({
      customerId:  webUserCustomerLinks.customerId,
      role:        webUserCustomerLinks.role,
      isPrimary:   webUserCustomerLinks.isPrimary,
    })
    .from(webUserCustomerLinks)
    .where(
      and(
        eq(webUserCustomerLinks.userId,  session.user.id),
        eq(webUserCustomerLinks.status,  "active"),
      ),
    );

  return ok(links);
}
