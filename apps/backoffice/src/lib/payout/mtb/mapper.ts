/**
 * Pangea <-> MTB shape mapping. Keeps Pangea's own SubmitPaymentInput and
 * transaction status vocabulary provider-agnostic — MTB's specific codes
 * (WE01/SR02/..., tranMode, wallet casing) only appear inside this file.
 */

import type { SubmitPaymentInput } from "../mock.adapter";
import type { MtbPaymentRequest, MtbRemitType, DistributiveOmit } from "./types";

// ---------------------------------------------------------------------------
// remitPurpose -> MTB remitType
// ---------------------------------------------------------------------------
const REMIT_PURPOSE_TO_TYPE: Record<NonNullable<SubmitPaymentInput["remitPurpose"]>, MtbRemitType> = {
  wage_earner:     "WE01",
  service_export:  "SR02",
  utility_bill:    "UR03",
  goods_export:    "GR04",
};

export function mapRemitPurpose(remitPurpose: SubmitPaymentInput["remitPurpose"]): MtbRemitType {
  if (!remitPurpose) {
    throw new Error("remitPurpose is required to route a payment through MTB (maps to MTB's remitType)");
  }
  return REMIT_PURPOSE_TO_TYPE[remitPurpose];
}

// ---------------------------------------------------------------------------
// walletProvider (Pangea, lowercase) -> MTB's exact casing
// ---------------------------------------------------------------------------
const WALLET_PROVIDER_TO_MTB: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  upay:  "Upay",
  ipay:  "iPay",
  stpay: "stPay",
};

function mapWalletProvider(walletProvider: string): string {
  const mapped = WALLET_PROVIDER_TO_MTB[walletProvider.toLowerCase()];
  if (!mapped) {
    throw new Error(`Unknown wallet provider "${walletProvider}" — expected one of: ${Object.keys(WALLET_PROVIDER_TO_MTB).join(", ")}`);
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Build the full MTB Payment Request body (minus reqId, added by the client)
// ---------------------------------------------------------------------------
export function buildPaymentRequest(input: SubmitPaymentInput): DistributiveOmit<MtbPaymentRequest, "reqId"> {
  const b = input.beneficiary;
  const payoutType = b.payoutType ?? "bank_account";

  if (!input.sender) {
    throw new Error("sender details are required to route a payment through MTB");
  }
  const sender = input.sender;

  const paymentInfo: MtbPaymentRequest["paymentInfo"] = {
    remitType:            mapRemitPurpose(input.remitPurpose),
    tranAmount:            input.sendAmount.toFixed(2),
    originatingCurrency:   input.sendCurrency,
    forexRate:             String(input.fxRate ?? 1),
    originatingAmount:     input.sendAmount.toFixed(2),
    sourceOfFund:          input.sourceOfFund ?? "Not specified",
    purposeOfFund:         input.purposeCode ?? "Not specified",
  };

  const senderInfo: MtbPaymentRequest["senderInfo"] = {
    senderName:        sender.name,
    senderPhone:       sender.phone,
    senderGender:      sender.gender ?? "N",
    senderOccupation:  sender.occupation ?? "Not specified",
    senderNationality: sender.nationality ?? b.country,
    senderAddressDtls: {
      sendingCountry: sender.sendingCountry ?? "GB",
      senderDistrict: sender.district,
      senderAddress:  sender.address ?? "Not specified",
    },
  };

  const beneficiaryInfo: MtbPaymentRequest["beneficiaryInfo"] = {
    beneficiaryName:        b.name,
    beneficiaryPhone:       b.phone ?? "+880",
    beneficiaryGender:      b.gender ?? "N",
    beneficiaryOccupation:  b.occupation ?? "Not specified",
    beneficiaryAddress:     b.bankName ?? "Not specified",
    beneRelationship:       input.beneficiaryRelationship ?? "Not specified",
  };

  const base = {
    referenceNumber: input.referenceNumber,
    paymentInfo,
    senderInfo,
    beneficiaryInfo,
  };

  switch (payoutType) {
    case "bank_account": {
      const channel = b.bankTransferChannel ?? "internal";
      if (channel === "internal") {
        return { ...base, tranMode: "MTB", mtbAccount: { beneficiaryAccount: b.accountNumber } };
      }
      if (!b.bankRoutingNumber) {
        throw new Error("bankRoutingNumber is required for OTHERBANK (BEFTN/RTGS/NPSB) payments");
      }
      return {
        ...base,
        tranMode: "OTHERBANK",
        otherBank: {
          tranChannel:  channel.toUpperCase() as "BEFTN" | "NPSB" | "RTGS",
          beneficiaryAccount: b.accountNumber,
          bankName:     b.bankName,
          routingNumber: b.bankRoutingNumber,
        },
      };
    }
    case "cash_pickup": {
      return { ...base, tranMode: "CASH" };
    }
    case "wallet": {
      if (!b.walletProvider || !b.walletMsisdn) {
        throw new Error("walletProvider and walletMsisdn are required for wallet payments");
      }
      return {
        ...base,
        tranMode: "WALLET",
        walletAccount: {
          beneficiaryAccount: b.walletMsisdn,
          accountOwner: mapWalletProvider(b.walletProvider),
        },
      };
    }
    case "utility_biller": {
      if (!b.utilityBillerCode || !input.utilityBillConversationId) {
        throw new Error(
          "utilityBillerCode and utilityBillConversationId are required for utility payments — " +
          "call the bill-validation endpoint first to obtain a conversationId (5-minute TTL)",
        );
      }
      return {
        ...base,
        tranMode: "UTILITY",
        utilityCollection: {
          billOwner: b.utilityBillerCode,
          billConversationId: input.utilityBillConversationId,
        },
      };
    }
    default: {
      const exhaustive: never = payoutType;
      throw new Error(`Unhandled payoutType: ${exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// MTB paymentState -> Pangea transactions.status
// ---------------------------------------------------------------------------
export type PangeaTransactionStatus =
  | "initiated" | "pending" | "processing" | "on_hold"
  | "completed" | "failed" | "cancelled" | "refunded";

const MTB_PAYMENT_STATE_TO_PANGEA_STATUS: Record<string, PangeaTransactionStatus> = {
  ACCEPTED:  "pending",     // received, AML/other processing running in the background
  LOCKED:    "on_hold",     // accounting issue (e.g. insufficient balance) — needs manual attention
  EXECUTED:  "processing",  // partner account debited, forwarded to the third-party rail
  COMPLETED: "completed",
  FAILED:    "failed",
  CANCELED:  "cancelled",
  RETURNED:  "failed",      // returned from Central Bank / partner — MTB's own doc labels this "Failed and Returned"
  REVERSED:  "refunded",    // value reversed back after a failed accounting step
};

export function mapPaymentStateToStatus(paymentState: string): PangeaTransactionStatus {
  return MTB_PAYMENT_STATE_TO_PANGEA_STATUS[paymentState] ?? "on_hold"; // unknown state — hold for manual review rather than guessing
}
