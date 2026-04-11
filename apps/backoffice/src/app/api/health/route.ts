import { NextResponse } from "next/server";
import { db } from "@pangea/db";
import { sql } from "drizzle-orm";

// GET /api/health — liveness + readiness check
// Used by load balancers, monitoring, and uptime checks.
// Returns 200 when healthy, 503 when the database is unreachable.
export async function GET() {
  const start = Date.now();

  try {
    // Minimal query to confirm DB connectivity
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status:    "ok",
      app:       "backoffice",
      db:        "ok",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status:    "error",
        app:       "backoffice",
        db:        "unreachable",
        error:     message,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
