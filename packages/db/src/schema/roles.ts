import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";

export const roles = mysqlTable("roles", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenantId:    varchar("tenant_id", { length: 36 }).references(() => tenants.id),
  name:        varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPrivileged: boolean("is_privileged").notNull().default(false),
  isSystem:    boolean("is_system").notNull().default(false), // system roles cannot be deleted
  status:      mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const userRoles = mysqlTable("user_roles", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId:      varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  roleId:      varchar("role_id", { length: 36 }).notNull().references(() => roles.id),
  tenantId:    varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  effectiveAt: timestamp("effective_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt:   timestamp("expires_at"),
  assignedBy:  varchar("assigned_by", { length: 36 }).references(() => users.id),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
