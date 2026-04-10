import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  decimal,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { customers } from "./customers";

// ---------------------------------------------------------------------------
// FX Quotes
// A quote is generated when a customer requests a rate.
// It is valid for a configurable window (default 30 seconds).
// On acceptance the quote is locked; on expiry it cannot be used.
// ---------------------------------------------------------------------------
export const fxQuotes = mysqlTable("fx_quotes", {
  id:             varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:       varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId:     varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),

  baseCurrency:   varchar("base_currency",  { length: 3 }).notNull(), // send currency
  quoteCurrency:  varchar("quote_currency", { length: 3 }).notNull(), // receive currency

  rate:           decimal("rate", { precision: 18, scale: 8 }).notNull(), // 1 base = rate quote
  sendAmount:     decimal("send_amount",    { precision: 18, scale: 4 }).notNull(),
  receiveAmount:  decimal("receive_amount", { precision: 18, scale: 4 }).notNull(),
  fee:            decimal("fee",            { precision: 18, scale: 4 }).notNull().default("0.0000"),

  // Source rate data
  rateDate:       varchar("rate_date",     { length: 10 }).notNull(), // YYYY-MM-DD from Frankfurter
  rateSource:     varchar("rate_source",   { length: 50 }).notNull().default("frankfurter"),

  status:         mysqlEnum("status", ["pending", "accepted", "expired", "used"]).notNull().default("pending"),

  expiresAt:      timestamp("expires_at").notNull(),
  acceptedAt:     timestamp("accepted_at"),
  usedAt:         timestamp("used_at"),

  createdAt:      timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FxQuote    = typeof fxQuotes.$inferSelect;
export type NewFxQuote = typeof fxQuotes.$inferInsert;
