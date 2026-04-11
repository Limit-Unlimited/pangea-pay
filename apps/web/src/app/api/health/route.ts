import { NextResponse } from "next/server";
import { db } from "@pangea/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status:    "ok",
      app:       "web",
      db:        "ok",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status:    "error",
        app:       "web",
        db:        "unreachable",
        error:     message,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
