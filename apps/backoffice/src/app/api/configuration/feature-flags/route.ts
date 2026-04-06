import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, featureFlags } from "@pangea/db";
import { ok, err, unauthorized, notFound } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const rows = await db.select().from(featureFlags).orderBy(featureFlags.name);
  return ok(rows);
}
