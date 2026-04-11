import { NextResponse } from "next/server";
import { db } from "@pangea/db";
import { sql } from "drizzle-orm";

// GET /api/health — unauthenticated liveness + readiness check
export async function GET() {
  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status:    "ok",
      app:       "rail",
      db:        "ok",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status:    "error",
        app:       "rail",
        db:        "unreachable",
        error:     message,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
