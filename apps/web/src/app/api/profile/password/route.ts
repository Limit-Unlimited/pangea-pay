import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, webUsers } from "@pangea/db";
import { auth } from "@/auth";
import { ok, err, unauthorized } from "@/lib/api/response";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(12).max(128),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const [webUser] = await db
    .select()
    .from(webUsers)
    .where(eq(webUsers.id, session.user.id))
    .limit(1);
  if (!webUser) return unauthorized();

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const { currentPassword, newPassword } = parsed.data;

  if (!webUser.passwordHash) return err("Password login is not available for this account.", 400);
  const valid = await verifyPassword(currentPassword, webUser.passwordHash);
  if (!valid) return err("Current password is incorrect.", 400);

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) return err(strength.message ?? "Password is not strong enough.", 400);

  const passwordHash = await hashPassword(newPassword);
  await db.update(webUsers).set({ passwordHash }).where(eq(webUsers.id, webUser.id));

  return ok({ message: "Password updated successfully." });
}
