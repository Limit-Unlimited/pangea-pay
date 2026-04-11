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
import { customers } from "./customers";
import { users } from "./users";
import { transactions } from "./transactions";

// ---------------------------------------------------------------------------
// Compliance Alerts — auto-generated from transaction monitoring rules
// ---------------------------------------------------------------------------
export const complianceAlerts = mysqlTable("compliance_alerts", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  alertRef:     varchar("alert_ref", { length: 30 }).notNull().unique(), // ALT-000001

  customerId:   varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),

  ruleCode:     varchar("rule_code", { length: 100 }).notNull(),  // e.g. HIGH_VALUE_SEND
  ruleName:     varchar("rule_name", { length: 255 }).notNull(),
  severity:     mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("medium"),

  status: mysqlEnum("status", [
    "open",
    "under_review",
    "cleared",
    "escalated",
    "closed",
  ]).notNull().default("open"),

  // The data that triggered the alert
  triggerDetails: text("trigger_details"),   // JSON string

  // Resolution
  reviewedBy:   varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewedAt:   timestamp("reviewed_at"),
  reviewNotes:  text("review_notes"),
  closedBy:     varchar("closed_by", { length: 36 }).references(() => users.id),
  closedAt:     timestamp("closed_at"),

  caseId:       varchar("case_id", { length: 36 }), // FK set later (circular ref avoided)

  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Compliance Cases — investigations grouping one or more alerts
// ---------------------------------------------------------------------------
export const complianceCases = mysqlTable("compliance_cases", {
  id:           varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:     varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  caseRef:      varchar("case_ref", { length: 30 }).notNull().unique(), // CASE-000001

  customerId:   varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),

  title:        varchar("title", { length: 255 }).notNull(),
  description:  text("description"),

  status: mysqlEnum("status", [
    "open",
    "under_investigation",
    "closed",
    "escalated_to_sar",
  ]).notNull().default("open"),

  priority:     mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),

  assignedTo:   varchar("assigned_to", { length: 36 }).references(() => users.id),

  // SAR details (populated when escalated_to_sar)
  sarReference: varchar("sar_reference", { length: 100 }),
  sarFiledAt:   timestamp("sar_filed_at"),
  sarFiledBy:   varchar("sar_filed_by", { length: 36 }).references(() => users.id),

  openedBy:     varchar("opened_by", { length: 36 }).references(() => users.id),
  openedAt:     timestamp("opened_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  closedBy:     varchar("closed_by", { length: 36 }).references(() => users.id),
  closedAt:     timestamp("closed_at"),
  closureNotes: text("closure_notes"),

  dueDate:      timestamp("due_date"),

  createdAt:    timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Case Notes — chronological notes on a compliance case
// ---------------------------------------------------------------------------
export const complianceCaseNotes = mysqlTable("compliance_case_notes", {
  id:        varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  caseId:    varchar("case_id", { length: 36 }).notNull().references(() => complianceCases.id, { onDelete: "cascade" }),
  tenantId:  varchar("tenant_id", { length: 36 }).notNull(),
  content:   text("content").notNull(),
  authorId:  varchar("author_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Transaction Monitoring Rules — configurable thresholds
// ---------------------------------------------------------------------------
export const monitoringRules = mysqlTable("monitoring_rules", {
  id:          varchar("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  tenantId:    varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),

  code:        varchar("code", { length: 100 }).notNull().unique(),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  ruleType:    mysqlEnum("rule_type", [
    "single_transaction_limit",
    "velocity_count",
    "velocity_amount",
    "high_risk_corridor",
    "pep_screening",
  ]).notNull(),

  // Threshold values (interpretation depends on ruleType)
  thresholdAmount:   decimal("threshold_amount", { precision: 18, scale: 4 }),
  thresholdCurrency: varchar("threshold_currency", { length: 3 }),
  thresholdCount:    int("threshold_count"),
  windowHours:       int("window_hours"),   // velocity window

  severity:    mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  isActive:    boolean("is_active").notNull().default(true),

  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
