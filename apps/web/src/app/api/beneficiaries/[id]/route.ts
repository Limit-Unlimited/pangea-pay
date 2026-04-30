import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, webUsers, beneficiaries } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";
import { resolveCustomerId } from "@/lib/auth/context";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/beneficiaries/[id] — remove a beneficiary
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [webUser] = await db.select().from(webUsers).where(eq(webUsers.id, session.user.id)).limit(1);
  const customerId = resolveCustomerId(webUser);
  if (!customerId) return err("No active customer account", 403);

  const [ben] = await db
    .select()
    .from(beneficiaries)
    .where(and(eq(beneficiaries.id, id), eq(beneficiaries.customerId, customerId)))
    .limit(1);

  if (!ben) return notFound("Beneficiary");
  if (ben.status === "blocked") return err("This beneficiary has been blocked by operations and cannot be removed", 403);

  await db.delete(beneficiaries).where(eq(beneficiaries.id, id));

  return ok({ message: "Beneficiary removed" });
}
