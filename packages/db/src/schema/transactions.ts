import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { accounts } from "./accounts";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Transactions — every payment, conversion, and fee event
// ---------------------------------------------------------------------------
export const transactions = mysqlTable("transactions", {
  id:              varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:        varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId:      varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),

  referenceNumber: varchar("reference_number", { length: 30 }).notNull().unique(), // TXN-000001

  type: mysqlEnum("type", [
    "send",
    "receive",
    "convert",
    "refund",
    "fee",
  ]).notNull(),

  status: mysqlEnum("status", [
    "initiated",
    "pending",
    "processing",
    "on_hold",
    "completed",
    "failed",
    "cancelled",
    "refunded",
  ]).notNull().default("initiated"),

  // Funding source (debit account)
  fromAccountId:   varchar("from_account_id", { length: 36 }).references(() => accounts.id),

  // Beneficiary (for send transactions)
  beneficiaryId:   varchar("beneficiary_id", { length: 36 }),

  // Amounts
  sendAmount:      decimal("send_amount", { precision: 18, scale: 4 }).notNull(),
  sendCurrency:    varchar("send_currency", { length: 3 }).notNull(),
  receiveAmount:   decimal("receive_amount", { precision: 18, scale: 4 }),
  receiveCurrency: varchar("receive_currency", { length: 3 }),

  // FX
  fxRate:          decimal("fx_rate", { precision: 18, scale: 8 }),
  fxQuoteId:       varchar("fx_quote_id", { length: 36 }),

  // Fees
  fee:             decimal("fee", { precision: 18, scale: 4 }).notNull().default("0.0000"),
  feeCurrency:     varchar("fee_currency", { length: 3 }).notNull(),

  // Routing
  payoutMethod:    varchar("payout_method", { length: 50 }),   // bank_transfer, wallet, etc.
  purposeCode:     varchar("purpose_code", { length: 50 }),
  customerRef:     varchar("customer_ref", { length: 100 }),   // customer's own reference

  // Provider
  providerRef:     varchar("provider_ref", { length: 100 }),   // mock or real provider reference
  providerName:    varchar("provider_name", { length: 50 }).notNull().default("mock"),

  // Hold
  holdReason:      text("hold_reason"),
  heldAt:          timestamp("held_at"),
  heldBy:          varchar("held_by", { length: 36 }).references(() => users.id),
  releasedAt:      timestamp("released_at"),
  releasedBy:      varchar("released_by", { length: 36 }).references(() => users.id),

  // Resolution
  completedAt:     timestamp("completed_at"),
  failedAt:        timestamp("failed_at"),
  failureReason:   text("failure_reason"),
  cancelledAt:     timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),

  // Flags
  isDuplicate:     boolean("is_duplicate").notNull().default(false),
  duplicateOf:     varchar("duplicate_of", { length: 36 }),

  notes:           text("notes"),

  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Transaction Status History — immutable audit trail of every status change
// ---------------------------------------------------------------------------
export const transactionStatusHistory = mysqlTable("transaction_status_history", {
  id:            varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  transactionId: varchar("transaction_id", { length: 36 }).notNull().references(() => transactions.id, { onDelete: "cascade" }),
  tenantId:      varchar("tenant_id", { length: 36 }).notNull(),
  fromStatus:    varchar("from_status", { length: 30 }),
  toStatus:      varchar("to_status", { length: 30 }).notNull(),
  reason:        text("reason"),
  performedBy:   varchar("performed_by", { length: 36 }).references(() => users.id), // null = system
  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
