/**
 * Mock Payout Adapter
 *
 * Simulates a banking/payout partner for development.
 * Replace with a real provider adapter when the commercial partner is finalised.
 *
 * Interface contract: every real adapter must implement PayoutAdapter.
 */

export interface SubmitPaymentInput {
  referenceNumber: string;
  sendAmount:      number;
  sendCurrency:    string;
  receiveAmount:   number;
  receiveCurrency: string;
  beneficiary: {
    name:          string;
    accountNumber: string;
    bankName?:     string;
    iban?:         string;
    sortCode?:     string;
    swiftBic?:     string;
    country:       string;
  };
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
  throw new Error(`Payout provider "${provider}" is not yet configured. Set PAYOUT_PROVIDER=mock for development.`);
}
