import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ensureLists, getListDefinition, updateList } from "@pangea/sanctions";
import { ok, err, unauthorized, forbidden, notFound } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/audit.service";
import { canManageSanctions } from "@/lib/sanctions/access";

export const maxDuration = 300;

// Largest official file is OFAC's SDN list (~30 MB); allow headroom.
const MAX_BYTES = 100 * 1024 * 1024;

type Params = { params: Promise<{ code: string }> };

/**
 * POST /api/sanctions/lists/[code]/upload: manual update from a file.
 *
 * For when the automatic download fails: a user downloads the official file
 * from the publisher's site and uploads it here. It goes through exactly the
 * same parsing, comparison, safety check and change log as a scheduled run.
 *
 * Multipart fields: file (required), note (required), force ("true" to apply
 * despite a failed safety check).
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  if (!canManageSanctions(session.user)) return forbidden();

  const { code } = await params;
  if (!getListDefinition(code)) return notFound("Sanctions list");

  const formData = await req.formData().catch(() => null);
  if (!formData) return err("Multipart form data required");

  const file = formData.get("file");
  if (!(file instanceof File)) return err("Choose the list file to upload.");
  if (file.size === 0) return err("The file is empty.");
  if (file.size > MAX_BYTES) return err("The file is larger than 100 MB.");
  if (!file.name.toLowerCase().endsWith(".xml")) return err("Upload the XML version of the list.");

  const note  = String(formData.get("note") ?? "").trim();
  const force = formData.get("force") === "true";
  if (!note) return err("Add a note saying where the file came from and why it is being uploaded.");

  await ensureLists();
  let result;
  try {
    result = await updateList(code, {
      trigger: "manual_upload",
      userId:  session.user.id,
      file:    { name: file.name, content: Buffer.from(await file.arrayBuffer()) },
      force,
      note,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Upload could not be processed", 409);
  }

  await writeAuditLog({
    actorId:    session.user.id,
    actorEmail: session.user.email,
    tenantId:   session.user.tenantId,
    action:     "sanctions.list.file_uploaded",
    resource:   "sanction_list",
    resourceId: code,
    newValue:   { ...result, fileName: file.name, fileBytes: file.size, force },
    reason:     note,
    ipAddress:  req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent:  req.headers.get("user-agent") ?? "",
  });

  return ok(result);
}
