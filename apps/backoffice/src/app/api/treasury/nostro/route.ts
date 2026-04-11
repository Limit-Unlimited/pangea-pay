import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, nostroAccounts } from "@pangea/db";
import { eq, count } from "drizzle-orm";
import { ok, unauthorized, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const rows = await db
    .select()
    .from(nostroAccounts)
    .where(eq(nostroAccounts.tenantId, tenantId));

  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const body = await req.json() as {
    bankName: string;
    bankCountry: string;
    currency: string;
    accountNumber?: string;
    iban?: string;
    swiftBic?: string;
    sortCode?: string;
    isSafeguarded?: "yes" | "no";
    notes?: string;
  };

  if (!body.bankName || !body.bankCountry || !body.currency) {
    return err("bankName, bankCountry, and currency are required");
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(nostroAccounts)
    .where(eq(nostroAccounts.tenantId, tenantId));

  const accountRef = `NOS-${String(total + 1).padStart(6, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(nostroAccounts) as any).values({
    id:            randomUUID(),
    tenantId,
    accountRef,
    bankName:      body.bankName,
    bankCountry:   body.bankCountry,
    currency:      body.currency,
    accountNumber: body.accountNumber ?? null,
    iban:          body.iban ?? null,
    swiftBic:      body.swiftBic ?? null,
    sortCode:      body.sortCode ?? null,
    isSafeguarded: body.isSafeguarded ?? "no",
    notes:         body.notes ?? null,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "treasury.nostro.created",
    resource:   "nostro_account",
    newValue:   { accountRef, bankName: body.bankName, currency: body.currency },
  });

  return ok({ accountRef }, 201);
}
