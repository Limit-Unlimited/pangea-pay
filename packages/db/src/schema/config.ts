import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
  int,
  decimal,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------
export const countries = mysqlTable("countries", {
  id:              varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  code:            varchar("code", { length: 2 }).notNull().unique(),   // ISO 3166-1 alpha-2
  name:            varchar("name", { length: 100 }).notNull(),
  dialCode:        varchar("dial_code", { length: 10 }),
  currencyCode:    varchar("currency_code", { length: 3 }),             // default currency
  isSendEnabled:   boolean("is_send_enabled").notNull().default(false),
  isReceiveEnabled: boolean("is_receive_enabled").notNull().default(false),
  status:          mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  createdAt:       timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Currencies
// ---------------------------------------------------------------------------
export const currencies = mysqlTable("currencies", {
  id:            varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  code:          varchar("code", { length: 3 }).notNull().unique(),     // ISO 4217
  name:          varchar("name", { length: 100 }).notNull(),
  symbol:        varchar("symbol", { length: 10 }).notNull(),
  decimalPlaces: int("decimal_places").notNull().default(2),
  status:        mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  createdAt:     timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Products (delivery methods)
// ---------------------------------------------------------------------------
export const products = mysqlTable("products", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  code:        varchar("code", { length: 50 }).notNull().unique(),
  name:        varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  type:        mysqlEnum("type", ["bank_transfer", "mobile_money", "cash_pickup", "wallet", "card"]).notNull(),
  status:      mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Corridors (send-country → receive-country pairs)
// ---------------------------------------------------------------------------
export const corridors = mysqlTable("corridors", {
  id:                  varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  sendCountryCode:     varchar("send_country_code", { length: 2 }).notNull().references(() => countries.code),
  receiveCountryCode:  varchar("receive_country_code", { length: 2 }).notNull().references(() => countries.code),
  sendCurrencyCode:    varchar("send_currency_code", { length: 3 }).notNull().references(() => currencies.code),
  receiveCurrencyCode: varchar("receive_currency_code", { length: 3 }).notNull().references(() => currencies.code),
  minSendAmount:       decimal("min_send_amount", { precision: 18, scale: 2 }).notNull().default("1.00"),
  maxSendAmount:       decimal("max_send_amount", { precision: 18, scale: 2 }).notNull().default("5000.00"),
  status:              mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  createdAt:           timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:           timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Pricing rules (per corridor + product)
// ---------------------------------------------------------------------------
export const pricingRules = mysqlTable("pricing_rules", {
  id:               varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  corridorId:       varchar("corridor_id", { length: 36 }).notNull().references(() => corridors.id, { onDelete: "cascade" }),
  productId:        varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  feeType:          mysqlEnum("fee_type", ["flat", "percentage", "tiered"]).notNull().default("flat"),
  feeValue:         decimal("fee_value", { precision: 18, scale: 4 }).notNull().default("0.0000"),
  fxMarkupPercent:  decimal("fx_markup_percent", { precision: 6, scale: 4 }).notNull().default("0.0000"),
  minFee:           decimal("min_fee", { precision: 18, scale: 2 }),
  maxFee:           decimal("max_fee", { precision: 18, scale: 2 }),
  status:           mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  createdAt:        timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------
export const featureFlags = mysqlTable("feature_flags", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key:         varchar("key", { length: 100 }).notNull().unique(),
  name:        varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  isEnabled:   boolean("is_enabled").notNull().default(false),
  createdAt:   timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type Country      = typeof countries.$inferSelect;
export type NewCountry   = typeof countries.$inferInsert;
export type Currency     = typeof currencies.$inferSelect;
export type NewCurrency  = typeof currencies.$inferInsert;
export type Product      = typeof products.$inferSelect;
export type NewProduct   = typeof products.$inferInsert;
export type Corridor     = typeof corridors.$inferSelect;
export type NewCorridor  = typeof corridors.$inferInsert;
export type PricingRule  = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;
export type FeatureFlag  = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
