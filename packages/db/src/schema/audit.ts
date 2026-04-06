import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";

export const auditLogs = mysqlTable("audit_logs", {
  id:         varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenantId:   varchar("tenant_id", { length: 36 }).references(() => tenants.id),
  actorId:    varchar("actor_id", { length: 36 }).references(() => users.id),
  actorEmail: varchar("actor_email", { length: 255 }),  // snapshot — preserved if user is deleted
  action:     varchar("action", { length: 100 }).notNull(),
  resource:   varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 36 }),
  oldValue:   json("old_value"),
  newValue:   json("new_value"),
  reason:     text("reason"),
  ipAddress:  varchar("ip_address", { length: 45 }),
  userAgent:  text("user_agent"),
  createdAt:  timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
