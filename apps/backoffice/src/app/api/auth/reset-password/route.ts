import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, users, passwordResetTokens } from "@pangea/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit.service";

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(12),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const strengthResult = validatePasswordStrength(password);
  if (!strengthResult.valid) {
    return NextResponse.json({ error: strengthResult.message ?? "Password does not meet requirements." }, { status: 400 });
  }

  const now = new Date();
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      )
    )
    .limit(1);

  if (!resetToken) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  const [user] = await db.select({ id: users.id, tenantId: users.tenantId, email: users.email, status: users.status })
    .from(users)
    .where(eq(users.id, resetToken.userId))
    .limit(1);

  if (!user || ["deactivated", "archived"].includes(user.status)) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const userStatus = user.status === "locked" ? "active" : user.status;

  await db.update(users)
    .set({ passwordHash, status: userStatus as any, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    tenantId: user.tenantId,
    action: "auth.password.reset_completed",
    resource: "user",
    resourceId: user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return NextResponse.json({ ok: true });
}
