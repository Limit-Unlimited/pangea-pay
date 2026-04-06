import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

export const users = mysqlTable("users", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenantId:    varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  email:       varchar("email", { length: 255 }).notNull().unique(),
  firstName:   varchar("first_name", { length: 100 }).notNull(),
  lastName:    varchar("last_name", { length: 100 }).notNull(),
  jobTitle:    varchar("job_title", { length: 150 }),
  department:  varchar("department", { length: 100 }),
  mobile:      varchar("mobile", { length: 30 }),
  status:      mysqlEnum("status", ["invited", "pending_activation", "active", "suspended", "locked", "deactivated", "archived"]).notNull().default("invited"),
  mfaEnabled:  boolean("mfa_enabled").notNull().default(false),
  mfaSecret:   varchar("mfa_secret", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  lastLoginAt: timestamp("last_login_at"),
  invitedAt:   timestamp("invited_at"),
  activatedAt: timestamp("activated_at"),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const sessions = mysqlTable("sessions", {
  id:        varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId:    varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  tenantId:  varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  token:     varchar("token", { length: 512 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
