import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { customers } from "./customers";

// ---------------------------------------------------------------------------
// Web App Users (retail customers authenticating through the Web App)
// ---------------------------------------------------------------------------
export const webUsers = mysqlTable("web_users", {
  id:               varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:         varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  // May be null until linked after KYC approval
  customerId:       varchar("customer_id", { length: 36 }).references(() => customers.id),

  email:            varchar("email", { length: 255 }).notNull().unique(),
  emailVerified:    boolean("email_verified").notNull().default(false),

  phoneNumber:      varchar("phone_number", { length: 30 }),
  phoneVerified:    boolean("phone_verified").notNull().default(false),

  passwordHash:     varchar("password_hash", { length: 255 }),

  status:           mysqlEnum("status", ["pending_verification", "active", "suspended", "closed"]).notNull().default("pending_verification"),

  // Terms & conditions
  tcVersion:        varchar("tc_version", { length: 50 }),
  tcAcceptedAt:     timestamp("tc_accepted_at"),

  lastLoginAt:      timestamp("last_login_at"),
  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Email verifications (OTP or link token)
// ---------------------------------------------------------------------------
export const emailVerifications = mysqlTable("email_verifications", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  email:     varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(), // bcrypt hash of the 6-digit OTP
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Phone (SMS) verifications
// ---------------------------------------------------------------------------
export const phoneVerifications = mysqlTable("phone_verifications", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  phone:     varchar("phone", { length: 30 }).notNull(),
  otpHash:   varchar("otp_hash", { length: 255 }).notNull(), // bcrypt hash of the 6-digit OTP
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Web user sessions
// ---------------------------------------------------------------------------
export const webUserSessions = mysqlTable("web_user_sessions", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  userId:    varchar("user_id", { length: 36 }).notNull().references(() => webUsers.id, { onDelete: "cascade" }),
  tenantId:  varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  token:     varchar("token", { length: 512 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type WebUser              = typeof webUsers.$inferSelect;
export type NewWebUser           = typeof webUsers.$inferInsert;
export type EmailVerification    = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type PhoneVerification    = typeof phoneVerifications.$inferSelect;
export type NewPhoneVerification = typeof phoneVerifications.$inferInsert;
export type WebUserSession       = typeof webUserSessions.$inferSelect;
export type NewWebUserSession    = typeof webUserSessions.$inferInsert;
