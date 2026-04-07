import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, customerDocuments, customers } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const reviewSchema = z.object({
  status:          z.enum(["accepted", "rejected"]),
  rejectionReason: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string; docId: string }> };

// PATCH /api/customers/[id]/documents/[docId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id, docId } = await params;

  // Verify customer belongs to tenant
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const [doc] = await db
    .select({ id: customerDocuments.id, status: customerDocuments.status })
    .from(customerDocuments)
    .where(and(eq(customerDocuments.id, docId), eq(customerDocuments.customerId, id)))
    .limit(1);

  if (!doc) return err("Document not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  if (parsed.data.status === "rejected" && !parsed.data.rejectionReason) {
    return err("A rejection reason is required.");
  }

  await db
    .update(customerDocuments)
    .set({
      status:          parsed.data.status,
      reviewedBy:      session.user.id,
      reviewedAt:      new Date(),
      rejectionReason: parsed.data.rejectionReason ?? null,
    })
    .where(eq(customerDocuments.id, docId));

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     `customer.document_${parsed.data.status}`,
    resource:   "customer_document",
    resourceId: docId,
    oldValue:   { status: doc.status },
    newValue:   { status: parsed.data.status, rejectionReason: parsed.data.rejectionReason ?? null },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: docId, status: parsed.data.status });
}
