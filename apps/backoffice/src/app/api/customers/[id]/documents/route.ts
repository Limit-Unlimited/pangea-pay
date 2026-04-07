import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db, customers, customerDocuments } from "@pangea/db";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { ok, err, unauthorized } from "@/lib/api/response";

const createSchema = z.object({
  documentType: z.enum([
    "passport", "national_id", "driving_licence", "proof_of_address",
    "company_registration", "certificate_of_incorporation", "bank_statement",
    "utility_bill", "other",
  ]),
  documentNumber:  z.string().max(100).optional(),
  issuingCountry:  z.string().length(2).optional(),
  issueDate:       z.string().optional(),
  expiryDate:      z.string().optional(),
  fileKey:         z.string().max(500).optional(),
  fileName:        z.string().max(255).optional(),
  fileMimeType:    z.string().max(100).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]/documents
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const docs = await db
    .select()
    .from(customerDocuments)
    .where(eq(customerDocuments.customerId, id))
    .orderBy(desc(customerDocuments.createdAt));

  return ok(docs);
}

// POST /api/customers/[id]/documents
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, session.user.tenantId)))
    .limit(1);

  if (!customer) return err("Customer not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");

  const docId = randomUUID();
  await (db.insert(customerDocuments) as any).values({
    id:             docId,
    customerId:     id,
    tenantId:       session.user.tenantId,
    documentType:   parsed.data.documentType,
    documentNumber: parsed.data.documentNumber ?? null,
    issuingCountry: parsed.data.issuingCountry ?? null,
    issueDate:      parsed.data.issueDate ?? null,
    expiryDate:     parsed.data.expiryDate ?? null,
    fileKey:        parsed.data.fileKey ?? null,
    fileName:       parsed.data.fileName ?? null,
    fileMimeType:   parsed.data.fileMimeType ?? null,
    uploadedBy:     session.user.id,
  });

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "customer.document_added",
    resource:   "customer_document",
    resourceId: docId,
    newValue:   { customerId: id, documentType: parsed.data.documentType },
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok({ id: docId }, 201);
}
