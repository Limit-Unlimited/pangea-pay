import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  decimal,
  boolean,
  int,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { users } from "./users";
import { transactions } from "./transactions";

// ---------------------------------------------------------------------------
// Chart of Accounts
// ---------------------------------------------------------------------------
export const chartOfAccounts = mysqlTable("chart_of_accounts", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  code:         varchar("code", { length: 20 }).notNull(),   // e.g. 1001
  name:         varchar("name", { length: 255 }).notNull(),
  description:  text("description"),

  accountType:  mysqlEnum("account_type", [
    "asset",
    "liability",
    "equity",
    "revenue",
    "expense",
  ]).notNull(),

  subType:      varchar("sub_type", { length: 100 }),   // e.g. "current_asset", "payable"

  currency:     varchar("currency", { length: 3 }),     // null = multi-currency

  parentId:     varchar("parent_id", { length: 36 }),   // for hierarchical CoA

  isSystem:     boolean("is_system").notNull().default(false),  // auto-posted by system
  isActive:     boolean("is_active").notNull().default(true),

  // Running balance
  balance:      decimal("balance", { precision: 18, scale: 4 }).notNull().default("0.0000"),

  sortOrder:    int("sort_order").notNull().default(0),

  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Journal Entries — each double-entry posting event
// ---------------------------------------------------------------------------
export const journalEntries = mysqlTable("journal_entries", {
  id:            varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:      varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  entryRef:      varchar("entry_ref", { length: 30 }).notNull().unique(), // JNL-000001

  entryDate:     timestamp("entry_date").notNull(),
  description:   varchar("description", { length: 500 }).notNull(),

  entryType:     mysqlEnum("entry_type", [
    "payment",
    "fee",
    "fx_gain_loss",
    "prefunding",
    "correction",
    "manual",
  ]).notNull(),

  // Link to source event (optional)
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),

  status:        mysqlEnum("status", ["draft", "posted", "reversed"]).notNull().default("draft"),

  postedAt:      timestamp("posted_at"),
  postedBy:      varchar("posted_by", { length: 36 }).references(() => users.id),

  reversedAt:    timestamp("reversed_at"),
  reversedBy:    varchar("reversed_by", { length: 36 }).references(() => users.id),
  reversalOf:    varchar("reversal_of", { length: 36 }),  // ref to original entry id

  createdBy:     varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Journal Lines — individual debit/credit lines on a journal entry
// ---------------------------------------------------------------------------
export const journalLines = mysqlTable("journal_lines", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  journalEntryId: varchar("journal_entry_id", { length: 36 }).notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull(),

  accountId:    varchar("account_id", { length: 36 }).notNull().references(() => chartOfAccounts.id),

  side:         mysqlEnum("side", ["debit", "credit"]).notNull(),
  amount:       decimal("amount", { precision: 18, scale: 4 }).notNull(),
  currency:     varchar("currency", { length: 3 }).notNull(),

  // FX if amount is in non-base currency
  baseAmount:   decimal("base_amount", { precision: 18, scale: 4 }),
  baseCurrency: varchar("base_currency", { length: 3 }),
  fxRate:       decimal("fx_rate", { precision: 18, scale: 8 }),

  description:  varchar("description", { length: 255 }),

  lineOrder:    int("line_order").notNull().default(0),
  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
