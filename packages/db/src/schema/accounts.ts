import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  decimal,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { users } from "./users";
import { customers } from "./customers";

// ---------------------------------------------------------------------------
// Customer Accounts (wallets / current accounts)
// ---------------------------------------------------------------------------
export const accounts = mysqlTable("accounts", {
  id:               varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:         varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId:       varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),

  accountNumber:    varchar("account_number", { length: 30 }).notNull().unique(), // e.g. ACC-000001
  accountType:      mysqlEnum("account_type", ["current", "wallet"]).notNull().default("current"),
  currency:         varchar("currency", { length: 3 }).notNull(),              // ISO 4217

  status:           mysqlEnum("status", ["pending", "active", "blocked", "suspended", "closed"]).notNull().default("pending"),

  currentBalance:   decimal("current_balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),
  availableBalance: decimal("available_balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),
  reservedBalance:  decimal("reserved_balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),

  openDate:         date("open_date"),
  closedAt:         timestamp("closed_at"),
  closedReason:     text("closed_reason"),

  notes:            text("notes"),

  createdBy:        varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Account status history
// ---------------------------------------------------------------------------
export const accountStatusHistory = mysqlTable("account_status_history", {
  id:          varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  accountId:   varchar("account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  tenantId:    varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  fromStatus:  varchar("from_status", { length: 30 }).notNull(),
  toStatus:    varchar("to_status", { length: 30 }).notNull(),
  reason:      text("reason"),

  changedBy:   varchar("changed_by", { length: 36 }).references(() => users.id),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Beneficiaries (per customer)
// ---------------------------------------------------------------------------
export const beneficiaries = mysqlTable("beneficiaries", {
  id:               varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:         varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId:       varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),

  displayName:      varchar("display_name", { length: 255 }).notNull(),
  firstName:        varchar("first_name", { length: 100 }),
  lastName:         varchar("last_name", { length: 100 }),

  bankName:         varchar("bank_name", { length: 255 }),
  accountNumber:    varchar("account_number", { length: 50 }),
  iban:             varchar("iban", { length: 34 }),
  sortCode:         varchar("sort_code", { length: 10 }),
  swiftBic:         varchar("swift_bic", { length: 11 }),

  currency:         varchar("currency", { length: 3 }).notNull(),
  country:          varchar("country", { length: 2 }).notNull(),

  // Internal Pangea account link — set when this beneficiary is another Pangea account
  pangeaAccountId:  varchar("pangea_account_id", { length: 36 }).references(() => accounts.id),

  status:           mysqlEnum("status", ["active", "flagged", "blocked"]).notNull().default("active"),
  flagReason:       text("flag_reason"),
  flaggedBy:        varchar("flagged_by", { length: 36 }).references(() => users.id),
  flaggedAt:        timestamp("flagged_at"),

  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Account              = typeof accounts.$inferSelect;
export type NewAccount           = typeof accounts.$inferInsert;
export type AccountStatusHistory = typeof accountStatusHistory.$inferSelect;
export type NewAccountStatusHistory = typeof accountStatusHistory.$inferInsert;
export type Beneficiary    = typeof beneficiaries.$inferSelect;
export type NewBeneficiary = typeof beneficiaries.$inferInsert;
