/**
 * MTB Payout Adapter — implements PayoutAdapter (mock.adapter.ts) against
 * Mutual Trust Bank's Remittance API, per "Remittance API_v3.2.pdf".
 *
 * cancel() is a deliberate no-op: MTB's API has no cancellation endpoint
 * (CANCELED only ever appears as a resulting status, never as something a
 * partner can trigger) — see the module-level comment on `cancel` below.
 */

import { loadMtbConfig, paymentRequest, statusQuery, billValidation, accountValidation as mtbAccountValidation } from "./mtb/client";
import { buildPaymentRequest, mapPaymentStateToStatus } from "./mtb/mapper";
import type { PayoutAdapter, SubmitPaymentInput, SubmitPaymentResult } from "./mock.adapter";

export const mtbPayoutAdapter: PayoutAdapter = {
  async submit(input: SubmitPaymentInput): Promise<SubmitPaymentResult> {
    const config = loadMtbConfig();
    let effectiveInput = input;

    // UTILITY payments need a fresh conversationId immediately before
    // PaymentRequest — it expires after 5 minutes, so it cannot be obtained
    // earlier in the flow (e.g. at Rail API submission time) if payments are
    // processed asynchronously by a worker that may run well after that.
    if (input.beneficiary.payoutType === "utility_biller") {
      if (!input.utilityBillerAccountNo || !input.beneficiary.utilityBillerCode) {
        return { providerRef: "", status: "failed", message: "utilityBillerAccountNo and beneficiary.utilityBillerCode are required for utility payments" };
      }
      const validation = await billValidation(config, {
        billerId:    input.utilityBillerAccountNo,
        billAmount:  input.sendAmount.toFixed(2),
        userMSISDN:  input.sender?.phone ?? input.beneficiary.phone ?? "",
        billOwner:   input.beneficiary.utilityBillerCode,
      });
      effectiveInput = { ...input, utilityBillConversationId: validation.conversationId };
    }

    let body;
    try {
      body = buildPaymentRequest(effectiveInput);
    } catch (e) {
      return { providerRef: "", status: "failed", message: e instanceof Error ? e.message : "Failed to build MTB payment request" };
    }

    const response = await paymentRequest(config, body);

    return {
      providerRef: response.pinNumber,
      status: response.paymentState === "ACCEPTED" ? "pending" : "failed",
      message: response.paymentStateDesc,
    };
  },

  async getStatus(providerRef: string): Promise<{ status: string; message?: string }> {
    const config = loadMtbConfig();
    const result = await statusQuery(config, { page: "1", referenceNumber: providerRef });

    const match = result.transactionDetails.find((t) => t.pinNumber === providerRef);
    if (!match) {
      return { status: "on_hold", message: `No MTB transaction found for reference ${providerRef} — check again shortly` };
    }
    return {
      status: mapPaymentStateToStatus(match.paymentState),
      message: match.paymentStateDesc,
    };
  },

  // MTB's Remittance API has no cancellation endpoint — CANCELED only
  // appears as a status StatusQuery can report back (triggered on MTB's
  // side), never as something a partner can call. Always returns
  // { success: false } with a clear reason so the caller (Backoffice's
  // transaction-status route) can surface this to ops rather than silently
  // treating it as a successful cancellation.
  async cancel(_providerRef: string, _reason: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: false,
      message: "MTB has no cancellation API. Place the transaction on hold and contact MTB support, or wait for it to reach a terminal status via Status Query.",
    };
  },
};

// Additional capability beyond the PayoutAdapter interface — MTB's own docs
// note Account Validation is "not mandatory for actual payment," so it's
// exposed here for ops to use as a manual pre-check rather than forced into
// every submit() call.
export async function validateMtbAccount(input: Parameters<typeof mtbAccountValidation>[1]) {
  const config = loadMtbConfig();
  return mtbAccountValidation(config, input);
}
