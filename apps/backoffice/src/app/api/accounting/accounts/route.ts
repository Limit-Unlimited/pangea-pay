import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, chartOfAccounts } from "@pangea/db";
import { eq, and } from "drizzle-orm";
import { ok, unauthorized, err } from "@/lib/api/response";
import { randomUUID } from "crypto";
import { writeAuditLog } from "@/lib/audit/audit.service";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";

  const rows = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.tenantId, tenantId))
    .orderBy(chartOfAccounts.sortOrder, chartOfAccounts.code);

  return ok(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const tenantId = (session.user as { tenantId?: string }).tenantId ?? "";
  const body = await req.json() as {
    code:        string;
    name:        string;
    description?: string;
    accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
    subType?:    string;
    currency?:   string;
    parentId?:   string;
    sortOrder?:  number;
  };

  if (!body.code || !body.name || !body.accountType) {
    return err("code, name, and accountType are required");
  }

  // Check code uniqueness within tenant
  const [existing] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.code, body.code)))
    .limit(1);

  if (existing) return err(`Account code '${body.code}' already exists`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(chartOfAccounts) as any).values({
    id:          randomUUID(),
    tenantId,
    code:        body.code,
    name:        body.name,
    description: body.description ?? null,
    accountType: body.accountType,
    subType:     body.subType ?? null,
    currency:    body.currency ?? null,
    parentId:    body.parentId ?? null,
    isSystem:    false,
    isActive:    true,
    balance:     "0.0000",
    sortOrder:   body.sortOrder ?? 0,
  });

  await writeAuditLog({
    tenantId,
    actorId:    session.user.id,
    actorEmail: session.user.email ?? "",
    action:     "accounting.coa.account_added",
    resource:   "chart_of_accounts",
    newValue:   { code: body.code, name: body.name, accountType: body.accountType },
  });

  return ok({ code: body.code }, 201);
}
