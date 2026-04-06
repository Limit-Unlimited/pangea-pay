import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const tenants = mysqlTable("tenants", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name:        varchar("name", { length: 255 }).notNull(),
  slug:        varchar("slug", { length: 100 }).notNull().unique(),
  legalName:   varchar("legal_name", { length: 255 }),
  status:      mysqlEnum("status", ["provisioning", "active", "suspended", "archived"]).notNull().default("provisioning"),
  environment: mysqlEnum("environment", ["development", "staging", "production"]).notNull().default("development"),
  region:      varchar("region", { length: 100 }),
  goLiveDate:  timestamp("go_live_date"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
