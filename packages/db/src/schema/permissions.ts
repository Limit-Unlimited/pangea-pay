import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { roles } from "./roles";

/**
 * Granular permission definitions — the full set of actions the system supports.
 * Permissions are global (not tenant-scoped); tenants control access via roles.
 */
export const permissions = mysqlTable("permissions", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key:         varchar("key", { length: 100 }).notNull().unique(), // e.g. "users.invite"
  category:    varchar("category", { length: 50 }).notNull(),     // e.g. "users"
  name:        varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Which permissions are granted to a role.
 */
export const rolePermissions = mysqlTable("role_permissions", {
  roleId:       varchar("role_id", { length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id", { length: 36 }).notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export type Permission    = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
