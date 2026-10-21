import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, sanctionLists } from "@pangea/db";
import { ensureLists, listHealth, updateAllLists, updateList } from "@pangea/sanctions";
import { ok, err, unauthorized, forbidden } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { sendSanctionsReviewEmail } from "@/lib/email/mailer";
import { canManageSanctions } from "@/lib/sanctions/access";

// Downloading and comparing every list can take a few minutes on the first load.
export const maxDuration = 300;

const manualSchema = z.object({
  listCode: z.string().min(1),
  force:    z.boolean().optional(),
  note:     z.string().max(2000).optional(),
});

/** Emails the configured compliance contacts about every list that needs review. */
async function notifyIfNeeded() {
  const to = process.env.SANCTIONS_ALERT_EMAIL?.trim();
  const lists = await db.select().from(sanctionLists);
  const flagged = lists
    .filter((l) => l.isActive)
    .map((l) => ({ name: l.name, health: listHealth(l) }))
    .flatMap((l) => (l.health.state === "needs_review" ? [{ name: l.name, reason: l.health.reason }] : []));

  if (!to || flagged.length === 0) return flagged.length;

  const base = process.env.BACKOFFICE_URL ?? process.env.NEXTAUTH_URL ?? "";
  try {
    await sendSanctionsReviewEmail(to, flagged, `${base}/compliance/sanctions`);
  } catch (e) {
    // The Backoffice banner still shows the problem; a mail failure must not fail the run.
    console.error("Sanctions review email could not be sent", e);
  }
  return flagged.length;
}

/**
 * POST /api/sanctions/update
 *
 * Cron (X-Cron-Secret, no tenant header): updates every active list, then
 * emails SANCTIONS_ALERT_EMAIL if any list needs manual review. Schedule
 * this daily.
 *
 * Signed-in user: { listCode, force?, note? } re-downloads one list now.
 * `force` applies a file the safety check rejected, and needs a note.
 */
export async function POST(req: NextRequest) {
  const cronSecret     = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    const results = await updateAllLists();
    const needsReview = await notifyIfNeeded();
    return NextResponse.json({ results, needsReview });
  }

  const session = await auth();
  if (!session?.user) return unauthorized();
  if (!canManageSanctions(session.user)) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = manualSchema.safeParse(body ?? {});
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid request");
  const { listCode, force, note } = parsed.data;

  if (force && !note?.trim()) return err("Add a note explaining why the safety check is being overridden.");

  await ensureLists();
  let result;
  try {
    result = await updateList(listCode, { trigger: "manual_fetch", userId: session.user.id, force, note });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Update could not start", 409);
  }

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "sanctions.list.update_requested",
    resource:   "sanction_list",
    resourceId: listCode,
    newValue:   { ...result, force: Boolean(force) },
    reason:     note,
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok(result);
}
