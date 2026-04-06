import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, permissions } from "@pangea/db";
import { asc } from "drizzle-orm";
import { ok, unauthorized } from "@/lib/api/response";

// GET /api/permissions — list all available permissions (for role builder)
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const rows = await db
    .select({ id: permissions.id, key: permissions.key, name: permissions.name, category: permissions.category })
    .from(permissions)
    .orderBy(permissions.category, asc(permissions.name));

  return ok(rows);
}
