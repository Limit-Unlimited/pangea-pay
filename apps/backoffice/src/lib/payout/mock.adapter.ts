/**
 * Mock Payout Adapter
 *
 * Simulates a banking/payout partner for development.
 * Replace with a real provider adapter when the commercial partner is finalised.
 *
 * Interface contract: every real adapter must implement PayoutAdapter.
 */

import { mtbPayoutAdapter } from "./mtb.adapter";

export interface SubmitPaymentInput {
  referenceNumber: string;
  sendAmount:      number;
  sendCurrency:    string;
  receiveAmount:   number;
  receiveCurrency: string;
  fxRate?:         number;
  beneficiary: {
    name:          string;
    accountNumber: string;
    bankName?:     string;
    iban?:         string;
    sortCode?:     string;
    swiftBic?:     string;
    country:       string;
    // Optional, provider-specific fields — ignored by the mock adapter,
    // consumed by richer adapters (e.g. mtb.adapter.ts) that support
    // payout rails beyond a plain bank transfer.
    phone?:                string;
    gender?:                "M" | "F" | "N";
    occupation?:            string;
    payoutType?:            "bank_account" | "cash_pickup" | "wallet" | "utility_biller";
    bankTransferChannel?:   "internal" | "beftn" | "rtgs" | "npsb";
    bankRoutingNumber?:     string;
    walletProvider?:        string;
    walletMsisdn?:          string;
    utilityBillerCode?:     string;
  };
  sender?: {
    name:           string;
    phone:          string;
    gender?:        "M" | "F" | "N";
    occupation?:    string;
    nationality?:   string; // ISO alpha-2
    sendingCountry?: string; // ISO alpha-2
    address?:       string;
    district?:      string;
  };
  // Pangea-native remit purpose vocabulary — provider adapters translate
  // this to their own internal classification (e.g. MTB's WE01/SR02/UR03/GR04).
  remitPurpose?: "wage_earner" | "service_export" | "utility_bill" | "goods_export";
  beneficiaryRelationship?: string;
  sourceOfFund?: string;
  utilityBillerAccountNo?: string;
  utilityBillConversationId?: string; // from a prior bill-validation call
  purposeCode?: string;
  customerRef?: string;
}

export interface SubmitPaymentResult {
  providerRef:  string;
  status:       "pending" | "processing" | "completed" | "failed";
  message?:     string;
}

export interface PayoutAdapter {
  submit(input: SubmitPaymentInput): Promise<SubmitPaymentResult>;
  getStatus(providerRef: string): Promise<{ status: string; message?: string }>;
  cancel(providerRef: string, reason: string): Promise<{ success: boolean }>;
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------
export const mockPayoutAdapter: PayoutAdapter = {
  async submit(input) {
    // Simulate a small processing delay
    await new Promise((r) => setTimeout(r, 50));

    // Generate a deterministic mock provider reference
    const providerRef = `MOCK-${input.referenceNumber.replace("TXN-", "")}`;

    return {
      providerRef,
      status:  "pending",
      message: "Payment accepted by mock provider — awaiting processing",
    };
  },

  async getStatus(_providerRef) {
    await new Promise((r) => setTimeout(r, 20));
    // Mock: all payments remain in "pending" until manually advanced via backoffice
    return { status: "pending", message: "Awaiting ops review" };
  },

  async cancel(_providerRef, _reason) {
    await new Promise((r) => setTimeout(r, 20));
    return { success: true };
  },
};

// ---------------------------------------------------------------------------
// Adapter registry — swap in a real adapter by setting PAYOUT_PROVIDER env var
// ---------------------------------------------------------------------------
export function getPayoutAdapter(): PayoutAdapter {
  const provider = process.env.PAYOUT_PROVIDER ?? "mock";
  if (provider === "mock") return mockPayoutAdapter;
  if (provider === "mtb") return mtbPayoutAdapter;
  throw new Error(`Payout provider "${provider}" is not yet configured. Set PAYOUT_PROVIDER=mock or PAYOUT_PROVIDER=mtb.`);
}
