import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  decimal,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Nostro Accounts — the firm's own accounts held at correspondent banks
// ---------------------------------------------------------------------------
export const nostroAccounts = mysqlTable("nostro_accounts", {
  id:             varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:       varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  accountRef:     varchar("account_ref", { length: 30 }).notNull().unique(), // NOS-000001

  bankName:       varchar("bank_name", { length: 255 }).notNull(),
  bankCountry:    varchar("bank_country", { length: 2 }).notNull(),
  currency:       varchar("currency", { length: 3 }).notNull(),

  accountNumber:  varchar("account_number", { length: 50 }),
  iban:           varchar("iban", { length: 50 }),
  swiftBic:       varchar("swift_bic", { length: 15 }),
  sortCode:       varchar("sort_code", { length: 10 }),

  // Running balances (updated via nostro_entries)
  bookBalance:    decimal("book_balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),
  valueBalance:   decimal("value_balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),

  // Safeguarding flag
  isSafeguarded:  mysqlEnum("is_safeguarded", ["yes", "no"]).notNull().default("no"),

  status:         mysqlEnum("status", ["active", "inactive", "dormant"]).notNull().default("active"),
  notes:          text("notes"),

  createdAt:      timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:      timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Nostro Entries — movements on a nostro account
// ---------------------------------------------------------------------------
export const nostroEntries = mysqlTable("nostro_entries", {
  id:              varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  nostroAccountId: varchar("nostro_account_id", { length: 36 }).notNull().references(() => nostroAccounts.id),
  tenantId:        varchar("tenant_id", { length: 36 }).notNull(),

  entryRef:        varchar("entry_ref", { length: 60 }),  // bank's own reference
  valueDate:       timestamp("value_date").notNull(),

  direction:       mysqlEnum("direction", ["credit", "debit"]).notNull(),
  amount:          decimal("amount", { precision: 18, scale: 4 }).notNull(),
  currency:        varchar("currency", { length: 3 }).notNull(),

  // Running balance after this entry
  runningBalance:  decimal("running_balance", { precision: 18, scale: 4 }).notNull(),

  description:     varchar("description", { length: 500 }),
  transactionId:   varchar("transaction_id", { length: 36 }),  // link to transaction if applicable

  // Reconciliation
  isReconciled:    mysqlEnum("is_reconciled", ["yes", "no"]).notNull().default("no"),
  reconciledAt:    timestamp("reconciled_at"),
  reconciledBy:    varchar("reconciled_by", { length: 36 }).references(() => users.id),

  recordedBy:      varchar("recorded_by", { length: 36 }).references(() => users.id),
  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Prefunding Records — client funds received ahead of payment execution
// ---------------------------------------------------------------------------
export const prefundingRecords = mysqlTable("prefunding_records", {
  id:              varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:        varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  nostroAccountId: varchar("nostro_account_id", { length: 36 }).notNull().references(() => nostroAccounts.id),

  prefundRef:      varchar("prefund_ref", { length: 30 }).notNull().unique(), // PF-000001

  amount:          decimal("amount", { precision: 18, scale: 4 }).notNull(),
  currency:        varchar("currency", { length: 3 }).notNull(),
  valueDate:       timestamp("value_date").notNull(),

  status:          mysqlEnum("status", ["received", "allocated", "refunded"]).notNull().default("received"),
  notes:           text("notes"),

  recordedBy:      varchar("recorded_by", { length: 36 }).references(() => users.id),
  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
