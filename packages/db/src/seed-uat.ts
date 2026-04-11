/**
 * UAT seed script — populates the database with representative demo data
 * for user acceptance testing. Run AFTER the main seed.ts.
 *
 * Creates:
 *  - 3 demo customers (individual + business)
 *  - Accounts for each customer
 *  - Beneficiaries
 *  - Sample transactions (pending, completed, failed)
 *  - A demo API consumer with known credentials
 *  - A compliance alert
 *
 * Usage: pnpm --filter @pangea/db db:seed-uat
 *
 * IMPORTANT: Do not run on production. UAT/staging only.
 */

import "dotenv/config";
import { db } from "./client";
import {
  tenants, customers, accounts, beneficiaries,
  transactions, transactionStatusHistory,
  apiConsumers,
  complianceAlerts,
} from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function uuid(): string {
  return crypto.randomUUID();
}

async function main() {
  console.log("🌱  UAT seed starting…");

  // Find default tenant
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).limit(1);
  if (!tenant) {
    console.error("No tenant found. Run the main seed.ts first.");
    process.exit(1);
  }

  const tenantId = tenant.id;
  console.log(`  Tenant: ${tenantId}`);

  // -------------------------------------------------------------------------
  // Customers
  // -------------------------------------------------------------------------
  const custIds = { alice: uuid(), bob: uuid(), acme: uuid() };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(customers) as any).values([
    {
      id:               custIds.alice,
      tenantId,
      customerRef:      "CUST-UAT001",
      type:             "individual",
      status:           "active",
      onboardingStatus: "approved",
      riskCategory:     "low",
      firstName:        "Alice",
      lastName:         "Mensah",
      dateOfBirth:      "1988-03-15",
      nationality:      "GB",
      countryOfResidence: "GB",
      email:            "alice.mensah@demo.pangea",
      phone:            "+447700900123",
      addressLine1:     "12 Victoria Street",
      city:             "London",
      postCode:         "SW1H 0NB",
      country:          "GB",
      sourceOfFunds:    "Employment",
      screeningStatus:  "clear",
    },
    {
      id:               custIds.bob,
      tenantId,
      customerRef:      "CUST-UAT002",
      type:             "individual",
      status:           "active",
      onboardingStatus: "approved",
      riskCategory:     "medium",
      firstName:        "Bob",
      lastName:         "Osei",
      dateOfBirth:      "1975-11-20",
      nationality:      "GH",
      countryOfResidence: "GB",
      email:            "bob.osei@demo.pangea",
      phone:            "+447700900456",
      addressLine1:     "47 Commercial Road",
      city:             "Manchester",
      postCode:         "M1 2PW",
      country:          "GB",
      sourceOfFunds:    "Self-employed",
      screeningStatus:  "clear",
    },
    {
      id:               custIds.acme,
      tenantId,
      customerRef:      "CUST-UAT003",
      type:             "business",
      status:           "active",
      onboardingStatus: "approved",
      riskCategory:     "low",
      legalEntityName:  "Acme Imports Ltd",
      tradingName:      "Acme Imports",
      registrationNumber: "12345678",
      incorporationCountry: "GB",
      incorporationDate: "2015-06-01",
      businessType:     "Ltd",
      businessSector:   "Retail",
      email:            "finance@acme-imports.demo.pangea",
      phone:            "+442071234567",
      addressLine1:     "100 Cheapside",
      city:             "London",
      postCode:         "EC2V 6DT",
      country:          "GB",
      screeningStatus:  "clear",
    },
  ]).onDuplicateKeyUpdate({ set: { status: "active" } });

  console.log("  ✔  Customers");

  // -------------------------------------------------------------------------
  // Accounts
  // -------------------------------------------------------------------------
  const acctIds = { aliceGBP: uuid(), bobGBP: uuid(), acmeGBP: uuid(), acmeEUR: uuid() };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(accounts) as any).values([
    {
      id: acctIds.aliceGBP, tenantId, customerId: custIds.alice,
      accountNumber: "ACC-UAT001", accountType: "current", currency: "GBP",
      status: "active", currentBalance: "2500.0000", availableBalance: "2500.0000", reservedBalance: "0.0000",
    },
    {
      id: acctIds.bobGBP, tenantId, customerId: custIds.bob,
      accountNumber: "ACC-UAT002", accountType: "current", currency: "GBP",
      status: "active", currentBalance: "850.0000", availableBalance: "850.0000", reservedBalance: "0.0000",
    },
    {
      id: acctIds.acmeGBP, tenantId, customerId: custIds.acme,
      accountNumber: "ACC-UAT003", accountType: "current", currency: "GBP",
      status: "active", currentBalance: "15000.0000", availableBalance: "15000.0000", reservedBalance: "0.0000",
    },
    {
      id: acctIds.acmeEUR, tenantId, customerId: custIds.acme,
      accountNumber: "ACC-UAT004", accountType: "current", currency: "EUR",
      status: "active", currentBalance: "5000.0000", availableBalance: "5000.0000", reservedBalance: "0.0000",
    },
  ]).onDuplicateKeyUpdate({ set: { status: "active" } });

  console.log("  ✔  Accounts");

  // -------------------------------------------------------------------------
  // Beneficiaries
  // -------------------------------------------------------------------------
  const beneIds = { aliceDE: uuid(), bobGH: uuid() };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(beneficiaries) as any).values([
    {
      id: beneIds.aliceDE, tenantId, customerId: custIds.alice,
      displayName: "Hans Mueller", firstName: "Hans", lastName: "Mueller",
      bankName: "Deutsche Bank", iban: "DE89370400440532013000", swiftBic: "DEUTDEDB",
      currency: "EUR", country: "DE", status: "active",
    },
    {
      id: beneIds.bobGH, tenantId, customerId: custIds.bob,
      displayName: "Kwame Osei", firstName: "Kwame", lastName: "Osei",
      bankName: "GCB Bank", accountNumber: "1234567890",
      currency: "GHS", country: "GH", status: "active",
    },
  ]).onDuplicateKeyUpdate({ set: { status: "active" } });

  console.log("  ✔  Beneficiaries");

  // -------------------------------------------------------------------------
  // Transactions
  // -------------------------------------------------------------------------
  const txnIds = { t1: uuid(), t2: uuid(), t3: uuid() };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactions) as any).values([
    {
      id: txnIds.t1, tenantId, customerId: custIds.alice,
      referenceNumber: "TXN-UAT001", type: "send", status: "completed",
      fromAccountId: acctIds.aliceGBP, beneficiaryId: beneIds.aliceDE,
      sendAmount: "500.0000", sendCurrency: "GBP",
      receiveAmount: "586.2000", receiveCurrency: "EUR", fxRate: "1.17240000",
      fee: "7.5000", feeCurrency: "GBP",
      payoutMethod: "bank_transfer", providerRef: "MOCK-UAT001", providerName: "mock",
      completedAt: new Date(Date.now() - 86400000),
    },
    {
      id: txnIds.t2, tenantId, customerId: custIds.bob,
      referenceNumber: "TXN-UAT002", type: "send", status: "pending",
      fromAccountId: acctIds.bobGBP, beneficiaryId: beneIds.bobGH,
      sendAmount: "200.0000", sendCurrency: "GBP",
      receiveAmount: "2960.0000", receiveCurrency: "GHS", fxRate: "14.80000000",
      fee: "3.0000", feeCurrency: "GBP",
      payoutMethod: "bank_transfer", providerRef: "MOCK-UAT002", providerName: "mock",
    },
    {
      id: txnIds.t3, tenantId, customerId: custIds.acme,
      referenceNumber: "TXN-UAT003", type: "send", status: "failed",
      fromAccountId: acctIds.acmeGBP, beneficiaryId: beneIds.aliceDE,
      sendAmount: "10000.0000", sendCurrency: "GBP",
      fee: "50.0000", feeCurrency: "GBP",
      payoutMethod: "bank_transfer", providerRef: "MOCK-UAT003", providerName: "mock",
      failureReason: "Beneficiary account closed — demo failure scenario",
      failedAt: new Date(Date.now() - 3600000),
    },
  ]).onDuplicateKeyUpdate({ set: { status: "pending" } });

  // Status history for completed transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(transactionStatusHistory) as any).values([
    { id: uuid(), transactionId: txnIds.t1, tenantId, fromStatus: null,        toStatus: "pending",   reason: "Payment initiated" },
    { id: uuid(), transactionId: txnIds.t1, tenantId, fromStatus: "pending",   toStatus: "processing", reason: "Submitted to provider" },
    { id: uuid(), transactionId: txnIds.t1, tenantId, fromStatus: "processing", toStatus: "completed", reason: "Provider confirmed delivery" },
    { id: uuid(), transactionId: txnIds.t2, tenantId, fromStatus: null,        toStatus: "pending",   reason: "Payment initiated" },
    { id: uuid(), transactionId: txnIds.t3, tenantId, fromStatus: null,        toStatus: "pending",   reason: "Payment initiated" },
    { id: uuid(), transactionId: txnIds.t3, tenantId, fromStatus: "pending",   toStatus: "failed",    reason: "Beneficiary account closed — demo failure scenario" },
  ]).onDuplicateKeyUpdate({ set: { toStatus: "pending" } });

  console.log("  ✔  Transactions");

  // -------------------------------------------------------------------------
  // Demo API Consumer
  // -------------------------------------------------------------------------
  const consumerId   = uuid();
  const rawSecret    = "demo-secret-do-not-use-in-production";
  const secretHash   = await bcrypt.hash(rawSecret, 10);
  const webhookSecret = randomBytes(16).toString("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(apiConsumers) as any).values({
    id:              consumerId,
    tenantId,
    consumerRef:     "CON-UAT001",
    name:            "UAT Test Consumer",
    description:     "Demo consumer for UAT. client_id: pgn_uat_demo / client_secret: demo-secret-do-not-use-in-production",
    clientId:        "pgn_uat_demo",
    clientSecretHash: secretHash,
    status:          "active",
    scopes:          "customers:read beneficiaries:read beneficiaries:write quotes:read payments:read payments:write",
    rateLimitPerMin: 100,
    webhookUrl:      null,
    webhookSecret,
    environment:     "sandbox",
  }).onDuplicateKeyUpdate({ set: { status: "active" } });

  console.log("  ✔  API Consumer (client_id: pgn_uat_demo / secret: demo-secret-do-not-use-in-production)");

  // -------------------------------------------------------------------------
  // Compliance Alert
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.insert(complianceAlerts) as any).values({
    id:          uuid(),
    tenantId,
    alertRef:    "ALT-UAT001",
    customerId:  custIds.bob,
    ruleCode:    "HIGH_VALUE_SINGLE",
    ruleName:    "High-value single transaction",
    severity:    "medium",
    status:      "open",
    triggerDetails: JSON.stringify({ transactionId: txnIds.t2, amount: 200, currency: "GBP", threshold: 150 }),
  }).onDuplicateKeyUpdate({ set: { status: "open" } });

  console.log("  ✔  Compliance alert");

  console.log("\n✅  UAT seed complete.\n");
  console.log("  Demo credentials:");
  console.log("  - Customer (individual): CUST-UAT001 (Alice Mensah)");
  console.log("  - Customer (individual): CUST-UAT002 (Bob Osei) — has compliance alert");
  console.log("  - Customer (business):   CUST-UAT003 (Acme Imports Ltd)");
  console.log("  - API Consumer:          pgn_uat_demo / demo-secret-do-not-use-in-production");

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
