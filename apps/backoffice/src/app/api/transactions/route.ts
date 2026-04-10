import { NextRequest } from "next/server";
import { db, transactions, customers } from "@pangea/db";
import { eq, and, like, gte, lte, desc, or } from "drizzle-orm";
import { auth } from "@/auth";
import { ok, unauthorized } from "@/lib/api/response";

// GET /api/transactions — paginated transaction list with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;

  const page       = Math.max(1, parseInt(searchParams.get("page")    ?? "1",  10));
  const pageSize   = Math.min(100, parseInt(searchParams.get("limit") ?? "25", 10));
  const status     = searchParams.get("status")     ?? "";
  const type       = searchParams.get("type")       ?? "";
  const search     = searchParams.get("search")     ?? "";
  const customerId = searchParams.get("customerId") ?? "";
  const dateFrom   = searchParams.get("dateFrom")   ?? "";
  const dateTo     = searchParams.get("dateTo")     ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [eq(transactions.tenantId, session.user.tenantId)];

  if (status)     conditions.push(eq(transactions.status,     status as Parameters<typeof eq>[1]));
  if (type)       conditions.push(eq(transactions.type,       type   as Parameters<typeof eq>[1]));
  if (customerId) conditions.push(eq(transactions.customerId, customerId));
  if (dateFrom)   conditions.push(gte(transactions.createdAt, new Date(dateFrom)));
  if (dateTo)     conditions.push(lte(transactions.createdAt, new Date(dateTo)));

  const baseWhere = and(...conditions);

  const whereClause = search
    ? and(
        baseWhere,
        or(
          like(transactions.referenceNumber, `%${search}%`),
          like(transactions.customerRef,     `%${search}%`),
          like(transactions.providerRef,     `%${search}%`),
        )
      )
    : baseWhere;

  const rows = await db
    .select({
      id:                transactions.id,
      referenceNumber:   transactions.referenceNumber,
      customerId:        transactions.customerId,
      type:              transactions.type,
      status:            transactions.status,
      sendAmount:        transactions.sendAmount,
      sendCurrency:      transactions.sendCurrency,
      receiveAmount:     transactions.receiveAmount,
      receiveCurrency:   transactions.receiveCurrency,
      fee:               transactions.fee,
      feeCurrency:       transactions.feeCurrency,
      providerRef:       transactions.providerRef,
      providerName:      transactions.providerName,
      createdAt:         transactions.createdAt,
      completedAt:       transactions.completedAt,
      customerFirstName: customers.firstName,
      customerLastName:  customers.lastName,
      customerRef:       customers.customerRef,
    })
    .from(transactions)
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .where(whereClause)
    .orderBy(desc(transactions.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const all = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(whereClause);

  return ok({ data: rows, total: all.length, page, pageSize });
}
