import { NextRequest } from "next/server";
import { and, count, desc, eq, like, sql, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db, pepPersons } from "@pangea/db";
import { CATEGORIES, searchPeople, type PepCategory } from "@pangea/pep";
import { ok, unauthorized } from "@/lib/api/response";

const PAGE_SIZE = 50;
const CATEGORY_CODES = [...CATEGORIES.map((c) => c.category), "international_org"] as string[];

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

// GET /api/pep/persons?search=&kind=pep|rca&category=&country=&current=1&page=
// With a search, people are found by name similarity (best first); without
// one, the database is browsed alphabetically with the filters.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim() ?? "";
  const kind = sp.get("kind") === "pep" || sp.get("kind") === "rca" ? (sp.get("kind") as "pep" | "rca") : undefined;
  const category = CATEGORY_CODES.includes(sp.get("category") ?? "") ? (sp.get("category") as PepCategory) : undefined;
  const country = /^[A-Za-z]{2}$/.test(sp.get("country") ?? "") ? sp.get("country")!.toUpperCase() : undefined;
  const currentOnly = sp.get("current") === "1";
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);

  if (search) {
    const hits = (await searchPeople({ query: search, kind, category, limit: 200, minScore: 0.75 }))
      .filter((h) => (!country || h.countries.includes(country) || h.record?.nationalities.includes(country)) && (!currentOnly || h.isCurrent));
    return ok({
      rows: hits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((h) => ({
        id: h.id, ref: h.ref, kind: h.kind, primaryName: h.primaryName, matchedName: h.matchedName,
        score: Math.round(h.score * 100), topCategory: h.topCategory, isCurrent: h.isCurrent,
        countries: h.countries, datesOfBirth: h.record?.datesOfBirth ?? [],
        positions: (h.record?.positions ?? []).slice(0, 3),
        linkedTo: h.kind === "rca" ? (h.record?.relations ?? []).slice(0, 3) : [],
      })),
      page, pages: Math.max(1, Math.ceil(hits.length / PAGE_SIZE)), total: hits.length,
    });
  }

  const filters: SQL[] = [eq(pepPersons.isActive, true)];
  if (kind) filters.push(eq(pepPersons.kind, kind));
  if (category) filters.push(eq(pepPersons.topCategory, category));
  if (country) filters.push(like(pepPersons.countries, `%"${country}"%`));
  if (currentOnly) filters.push(eq(pepPersons.isCurrent, true));

  const [rows, [{ total }]] = await Promise.all([
    db.select({
        id: pepPersons.id, ref: pepPersons.sourceRef, kind: pepPersons.kind, primaryName: pepPersons.primaryName,
        topCategory: pepPersons.topCategory, isCurrent: pepPersons.isCurrent, countries: pepPersons.countries,
        datesOfBirth: pepPersons.datesOfBirth,
        positions: sql<string>`json_extract(${pepPersons.data}, '$.positions')`,
        relations: sql<string>`json_extract(${pepPersons.data}, '$.relations')`,
      })
      .from(pepPersons).where(and(...filters))
      .orderBy(desc(pepPersons.isCurrent), pepPersons.primaryName)
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(pepPersons).where(and(...filters)),
  ]);

  return ok({
    rows: rows.map((r) => ({
      id: r.id, ref: r.ref, kind: r.kind, primaryName: r.primaryName, matchedName: r.primaryName, score: null,
      topCategory: r.topCategory, isCurrent: r.isCurrent, countries: parseJson<string[]>(r.countries, []),
      datesOfBirth: parseJson<string[]>(r.datesOfBirth, []),
      positions: parseJson<unknown[]>(r.positions, []).slice(0, 3),
      linkedTo: r.kind === "rca" ? parseJson<unknown[]>(r.relations, []).slice(0, 3) : [],
    })),
    page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total,
  });
}
