import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
  mysqlEnum,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id:        varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId:    varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  token:     varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const loginAttempts = mysqlTable("login_attempts", {
  id:        varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email:     varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  success:   boolean("success").notNull().default(false),
  reason:    varchar("reason", { length: 100 }), // e.g. 'invalid_password', 'account_locked', 'mfa_failed'
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mfaChallenges = mysqlTable("mfa_challenges", {
  id:        varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId:    varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  token:     varchar("token", { length: 255 }).notNull().unique(), // challenge token stored in session
  verified:  boolean("verified").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type MfaChallenge = typeof mfaChallenges.$inferSelect;
