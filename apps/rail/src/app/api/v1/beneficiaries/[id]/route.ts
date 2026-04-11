import { NextRequest, NextResponse } from "next/server";
import { db, beneficiaries } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// GET /api/v1/beneficiaries/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAuth(req, "beneficiaries:read");
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;

  const [beneficiary] = await db
    .select()
    .from(beneficiaries)
    .where(and(
      eq(beneficiaries.id, id),
      eq(beneficiaries.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!beneficiary || beneficiary.status === "blocked") {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }

  return NextResponse.json({ data: beneficiary });
}

// DELETE /api/v1/beneficiaries/:id — soft-block
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAuth(req, "beneficiaries:write");
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;

  const [beneficiary] = await db
    .select({ id: beneficiaries.id, tenantId: beneficiaries.tenantId })
    .from(beneficiaries)
    .where(and(
      eq(beneficiaries.id, id),
      eq(beneficiaries.tenantId, ctx.tenantId),
    ))
    .limit(1);

  if (!beneficiary) {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.update(beneficiaries) as any)
    .set({ status: "blocked" })
    .where(eq(beneficiaries.id, id));

  return new NextResponse(null, { status: 204 });
}
