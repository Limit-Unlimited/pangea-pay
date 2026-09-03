import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tenants } from "./tenants";
import { customers } from "./customers";

// ---------------------------------------------------------------------------
// Utility Billers — lookup of billers a payout provider can pay
// (e.g. DESCO/DPDC/WASA via MTB). Not a customer relationship — a biller has
// no name/gender/occupation the way a beneficiary does.
// ---------------------------------------------------------------------------
export const utilityBillers = mysqlTable("utility_billers", {
  id:          varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:    varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  billerCode:  varchar("biller_code", { length: 50 }).notNull(),   // e.g. DESCO-POST, DPDC-PRE, WASA
  billerName:  varchar("biller_name", { length: 150 }).notNull(),
  country:     varchar("country", { length: 2 }).notNull(),
  status:      mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),

  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Utility Bill Validations — audit/TTL cache of each bill-lookup call.
// The provider's conversationId is single-use and short-lived (e.g. MTB:
// 5 minutes) — this is a runtime artifact of a lookup, not a saved profile.
// ---------------------------------------------------------------------------
export const utilityBillValidations = mysqlTable("utility_bill_validations", {
  id:             varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:       varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId:     varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),

  billerCode:     varchar("biller_code", { length: 50 }).notNull(),
  billerAccountNo: varchar("biller_account_no", { length: 100 }).notNull(),
  billAmount:     varchar("bill_amount", { length: 30 }),          // kept as string — provider-sourced, not a Pangea-computed monetary value

  providerName:   varchar("provider_name", { length: 50 }).notNull().default("mock"),
  conversationId: varchar("conversation_id", { length: 100 }),     // provider-issued token required by the follow-up payment request
  expiresAt:      timestamp("expires_at").notNull(),

  createdAt:      timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type UtilityBiller             = typeof utilityBillers.$inferSelect;
export type NewUtilityBiller          = typeof utilityBillers.$inferInsert;
export type UtilityBillValidation     = typeof utilityBillValidations.$inferSelect;
export type NewUtilityBillValidation  = typeof utilityBillValidations.$inferInsert;
