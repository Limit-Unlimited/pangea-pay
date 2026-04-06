import { db, auditLogs, type NewAuditLog } from "@pangea/db";

export type AuditAction =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.logout"
  | "auth.mfa.enrolled"
  | "auth.mfa.verified"
  | "auth.mfa.failed"
  | "auth.password.reset_requested"
  | "auth.password.reset_completed"
  | "auth.password.changed"
  | "auth.account.locked"
  | "auth.account.unlocked"
  | "user.created"
  | "user.updated"
  | "user.status_changed"
  | "role.assigned"
  | "role.removed";

interface AuditParams {
  tenantId?: string;
  actorId?: string;
  actorEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    const entry: NewAuditLog = {
      tenantId:   params.tenantId ?? null,
      actorId:    params.actorId ?? null,
      actorEmail: params.actorEmail ?? null,
      action:     params.action,
      resource:   params.resource,
      resourceId: params.resourceId ?? null,
      oldValue:   params.oldValue ?? null,
      newValue:   params.newValue ?? null,
      reason:     params.reason ?? null,
      ipAddress:  params.ipAddress ?? null,
      userAgent:  params.userAgent ?? null,
    };
    await db.insert(auditLogs).values(entry);
  } catch (err) {
    // Audit failures must never break the main operation — log to stderr only
    console.error("[audit] Failed to write audit log:", err);
  }
}
