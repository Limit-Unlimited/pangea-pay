import { db, webUserCustomerLinks } from "@pangea/db";
import { and, eq } from "drizzle-orm";

export type MemberRole = "owner" | "admin" | "standard" | "view_only";

export async function resolveRole(webUserId: string, customerId: string): Promise<MemberRole | null> {
  const [link] = await db
    .select({ role: webUserCustomerLinks.role, status: webUserCustomerLinks.status })
    .from(webUserCustomerLinks)
    .where(and(eq(webUserCustomerLinks.userId, webUserId), eq(webUserCustomerLinks.customerId, customerId)))
    .limit(1);
  if (!link || link.status !== "active") return null;
  return link.role as MemberRole;
}

export function canManageTeam(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canInitiatePayments(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin" || role === "standard";
}
