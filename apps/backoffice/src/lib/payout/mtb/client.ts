/**
 * MTB Remittance API HTTP client — one method per endpoint from
 * "Remittance API_v3.2.pdf" §5, wrapping the field-level encryption
 * required for parameters marked "Encryption: Y" in each endpoint's
 * field table.
 *
 * Token caching is in-process (module-level) — acceptable for a single
 * Next.js server process; a cold start or multi-instance deployment will
 * re-authenticate, which MTB's API supports at any time.
 */

import { encryptField, decryptField } from "./crypto";
import type {
  MtbResponse,
  MtbAccessTokenResponse,
  MtbPartnerDetails,
  MtbAccountValidationRequest,
  MtbAccountValidationResponse,
  MtbBillValidationRequest,
  MtbBillValidationResponse,
  MtbPaymentRequest,
  MtbPaymentResponse,
  MtbStatusQueryRequest,
  MtbStatusQueryResponse,
  MtbAccountStatementRequest,
  MtbAccountStatementResponse,
  DistributiveOmit,
} from "./types";

export type MtbConfig = {
  apiUrl: string;
  channelId: string;
  username: string;
  password: string;
  requestKey: string;
  responseKey: string;
};

export function loadMtbConfig(): MtbConfig {
  const apiUrl      = process.env.MTB_API_URL;
  const channelId    = process.env.MTB_CHANNEL_ID;
  const username     = process.env.MTB_USERNAME;
  const password     = process.env.MTB_PASSWORD;
  const requestKey   = process.env.MTB_REQUEST_KEY;
  const responseKey  = process.env.MTB_RESPONSE_KEY;

  const missing = Object.entries({ apiUrl, channelId, username, password, requestKey, responseKey })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing MTB config env var(s): ${missing.join(", ")}`);
  }

  return { apiUrl: apiUrl!, channelId: channelId!, username: username!, password: password!, requestKey: requestKey!, responseKey: responseKey! };
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------
let cachedToken: { accessToken: string; expiresAt: number } | null = null;
const TOKEN_REFRESH_BUFFER_MS = 60_000; // refresh 60s before actual expiry

function reqId(): string {
  return `PGN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function postJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error(`MTB ${url} returned a non-JSON response (HTTP ${res.status})`);
  }
  return json as T;
}

async function getAccessToken(config: MtbConfig): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS > now) {
    return cachedToken.accessToken;
  }

  const basicAuth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const json = await postJson<MtbResponse<MtbAccessTokenResponse>>(
    `${config.apiUrl}/accessToken`,
    { remitChannelId: config.channelId },
    { Authorization: `Basic ${basicAuth}` },
  );

  if (json.respCode !== "RS0000" || !json.responseDetails?.accessToken) {
    throw new Error(`MTB accessToken failed: ${json.respCode} ${json.respDesc}`);
  }

  const expirySeconds = Number(json.responseDetails.expiryAfter) || 3600;
  cachedToken = {
    accessToken: json.responseDetails.accessToken,
    expiresAt: now + expirySeconds * 1000,
  };
  return cachedToken.accessToken;
}

async function authedPost<T>(config: MtbConfig, path: string, body: unknown): Promise<T> {
  const token = await getAccessToken(config);
  return postJson<T>(`${config.apiUrl}${path}`, body, { Authorization: `Bearer ${token}` });
}

// ---------------------------------------------------------------------------
// Exchange House Details
// ---------------------------------------------------------------------------
export async function partnerDetails(config: MtbConfig): Promise<MtbPartnerDetails> {
  const json = await authedPost<MtbResponse<MtbPartnerDetails>>(config, "/partnerDetails", { reqId: reqId() });
  if (json.respCode !== "RS0000" || !json.responseDetails) {
    throw new Error(`MTB partnerDetails failed: ${json.respCode} ${json.respDesc}`);
  }
  const d = json.responseDetails;
  return {
    ...d,
    nrtAccount:       decryptField(d.nrtAccount, config.responseKey),
    availableBalance: decryptField(d.availableBalance, config.responseKey),
    partnerAccountDetails: d.partnerAccountDetails.map((a) => ({
      ...a,
      accountNumber:    decryptField(a.accountNumber, config.responseKey),
      availableBalance: decryptField(a.availableBalance, config.responseKey),
    })),
  };
}

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------
export async function changePassword(config: MtbConfig, newPassword: string): Promise<void> {
  const json = await authedPost<MtbResponse<{ message?: string }>>(config, "/changePassword", {
    reqId: reqId(),
    newPassword: encryptField(newPassword, config.requestKey),
  });
  if (json.respCode !== "RS0000") {
    throw new Error(`MTB changePassword failed: ${json.respCode} ${json.respDesc}`);
  }
}

// ---------------------------------------------------------------------------
// Account Validation
// ---------------------------------------------------------------------------
export type AccountValidationInput = Omit<MtbAccountValidationRequest, "reqId" | "accountNo"> & { accountNo: string };

export async function accountValidation(config: MtbConfig, input: AccountValidationInput): Promise<MtbAccountValidationResponse> {
  const json = await authedPost<MtbResponse<MtbAccountValidationResponse>>(config, "/accountValidation", {
    reqId: reqId(),
    ...input,
    accountNo: encryptField(input.accountNo, config.requestKey),
  });
  if (json.respCode !== "RS0000" || !json.responseDetails) {
    throw new Error(`MTB accountValidation failed: ${json.respCode} ${json.respDesc}`);
  }
  const d = json.responseDetails;
  return {
    ...d,
    accountNo:   d.accountNo   ? decryptField(d.accountNo, config.responseKey)   : undefined,
    accountName: d.accountName ? decryptField(d.accountName, config.responseKey) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Bill Information Validation
// ---------------------------------------------------------------------------
export type BillValidationInput = Omit<MtbBillValidationRequest, "reqId" | "billerId" | "billAmount"> & {
  billerId: string;
  billAmount: string;
};

export async function billValidation(config: MtbConfig, input: BillValidationInput): Promise<MtbBillValidationResponse> {
  const json = await authedPost<MtbResponse<MtbBillValidationResponse>>(config, "/billValidation", {
    reqId: reqId(),
    ...input,
    billerId:   encryptField(input.billerId, config.requestKey),
    billAmount: encryptField(input.billAmount, config.requestKey),
  });
  if (json.respCode !== "RS0000" || !json.responseDetails) {
    throw new Error(`MTB billValidation failed: ${json.respCode} ${json.respDesc}`);
  }
  const d = json.responseDetails;
  return {
    ...d,
    conversationId: decryptField(d.conversationId, config.responseKey),
    billerId:       decryptField(d.billerId, config.responseKey),
    customerName:   decryptField(d.customerName, config.responseKey),
    billAmountDetails: {
      billAmount:      decryptField(d.billAmountDetails.billAmount, config.responseKey),
      meterCharge:     d.billAmountDetails.meterCharge     ? decryptField(d.billAmountDetails.meterCharge, config.responseKey)     : undefined,
      sourceTax:       d.billAmountDetails.sourceTax       ? decryptField(d.billAmountDetails.sourceTax, config.responseKey)       : undefined,
      surChargeAmount: d.billAmountDetails.surChargeAmount ? decryptField(d.billAmountDetails.surChargeAmount, config.responseKey) : undefined,
      vatAmount:       d.billAmountDetails.vatAmount       ? decryptField(d.billAmountDetails.vatAmount, config.responseKey)       : undefined,
      tariffAmount:    d.billAmountDetails.tariffAmount    ? decryptField(d.billAmountDetails.tariffAmount, config.responseKey)    : undefined,
      totalAmount:     decryptField(d.billAmountDetails.totalAmount, config.responseKey),
    },
  };
}

// ---------------------------------------------------------------------------
// Payment Request
// ---------------------------------------------------------------------------
export async function paymentRequest(config: MtbConfig, input: DistributiveOmit<MtbPaymentRequest, "reqId">): Promise<MtbPaymentResponse> {
  // Deep-copy + encrypt every field marked "Encryption: Y" for Payment Request:
  // referenceNumber, paymentInfo.tranAmount, and the mode-specific beneficiary
  // account / bank name / branch name / routing number / bill conversation id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    reqId: reqId(),
    ...input,
    referenceNumber: encryptField(input.referenceNumber, config.requestKey),
    paymentInfo: {
      ...input.paymentInfo,
      tranAmount: encryptField(input.paymentInfo.tranAmount, config.requestKey),
    },
  };

  if ("mtbAccount" in input) {
    body.mtbAccount = {
      ...input.mtbAccount,
      beneficiaryAccount: encryptField(input.mtbAccount.beneficiaryAccount, config.requestKey),
    };
  } else if ("otherBank" in input) {
    body.otherBank = {
      ...input.otherBank,
      beneficiaryAccount: encryptField(input.otherBank.beneficiaryAccount, config.requestKey),
      bankName:    input.otherBank.bankName    ? encryptField(input.otherBank.bankName, config.requestKey)    : undefined,
      branchName:  input.otherBank.branchName  ? encryptField(input.otherBank.branchName, config.requestKey)  : undefined,
      routingNumber: encryptField(input.otherBank.routingNumber, config.requestKey),
    };
  } else if ("walletAccount" in input) {
    body.walletAccount = {
      ...input.walletAccount,
      beneficiaryAccount: encryptField(input.walletAccount.beneficiaryAccount, config.requestKey),
    };
  } else if ("utilityCollection" in input) {
    body.utilityCollection = {
      ...input.utilityCollection,
      billConversationId: encryptField(input.utilityCollection.billConversationId, config.requestKey),
    };
  }
  // CASH mode: no mode-specific object, nothing further to encrypt.

  const json = await authedPost<MtbResponse<MtbPaymentResponse>>(config, "/PaymentRequest", body);
  if (!json.responseDetails) {
    throw new Error(`MTB PaymentRequest failed: ${json.respCode} ${json.respDesc}`);
  }
  return { ...json.responseDetails, pinNumber: decryptField(json.responseDetails.pinNumber, config.responseKey) };
}

// ---------------------------------------------------------------------------
// Status Query
// ---------------------------------------------------------------------------
export async function statusQuery(config: MtbConfig, input: Omit<MtbStatusQueryRequest, "reqId">): Promise<MtbStatusQueryResponse> {
  const body: Record<string, unknown> = { reqId: reqId(), ...input };
  if (input.referenceNumber) {
    body.referenceNumber = encryptField(input.referenceNumber, config.requestKey);
  }

  const json = await authedPost<MtbResponse<{
    contentDetails: MtbStatusQueryResponse["contentDetails"];
    transactionDetails: MtbStatusQueryResponse["transactionDetails"];
  }>>(config, "/StatusQuery", body);
  if (json.respCode !== "RS0000" || !json.responseDetails) {
    throw new Error(`MTB StatusQuery failed: ${json.respCode} ${json.respDesc}`);
  }
  const d = json.responseDetails;
  return {
    contentDetails: d.contentDetails,
    transactionDetails: d.transactionDetails.map((t) => ({
      ...t,
      statusCode:    decryptField(t.statusCode, config.responseKey),
      pinNumber:     decryptField(t.pinNumber, config.responseKey),
      paymentAmount: decryptField(t.paymentAmount, config.responseKey),
    })),
  };
}

// ---------------------------------------------------------------------------
// Account Statement
// ---------------------------------------------------------------------------
export async function accountStatement(config: MtbConfig, input: Omit<MtbAccountStatementRequest, "reqId">): Promise<MtbAccountStatementResponse> {
  const json = await authedPost<MtbResponse<MtbAccountStatementResponse>>(config, "/AccountStatement", {
    reqId: reqId(),
    ...input,
    accountNumber: encryptField(input.accountNumber, config.requestKey),
  });
  if (json.respCode !== "RS0000" || !json.responseDetails) {
    throw new Error(`MTB AccountStatement failed: ${json.respCode} ${json.respDesc}`);
  }
  return json.responseDetails; // no encrypted fields on statement lines per spec
}
