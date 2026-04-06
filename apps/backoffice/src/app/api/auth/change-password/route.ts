import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@pangea/db";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit.service";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(12),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 400 });
  }

  const [user] = await db.select({ id: users.id, tenantId: users.tenantId, email: users.email, passwordHash: users.passwordHash, status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  const newStatus = ["invited", "pending_activation"].includes(user.status) ? "active" : user.status;

  await db.update(users)
    .set({ passwordHash, status: newStatus as any, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    tenantId: user.tenantId,
    action: "auth.password.changed",
    resource: "user",
    resourceId: user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return NextResponse.json({ ok: true });
}
