/**
 * MTB Remittance API request/response shapes, per "Remittance API_v3.2.pdf"
 * §5 (API Specification) and "MTB_ResponseCode_v3.1.pdf" §6.
 */

// ---------------------------------------------------------------------------
// Common envelope
// ---------------------------------------------------------------------------
export type MtbResponse<T> = {
  reqId: string;
  respCode: string;
  respDesc: string;
  responseDetails?: T;
};

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------
export type MtbAccessTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiryAfter: string; // seconds, as a string
};

// ---------------------------------------------------------------------------
// Exchange House Details (Partner Details)
// ---------------------------------------------------------------------------
export type MtbPartnerDetails = {
  nrtAccount: string;         // encrypted
  availableBalance: string;   // encrypted
  tranModeActive: {
    wageEarnersRemittance: string; // "true"/"false"
    serviceRemittance: string;
    b2bRemittance: string;
    utilityRemittance: string;
    otherBankAccount: { beftn: string; rtgs: string; npsb: string };
    mtbAccount: string;
    cash: string;
    wallet: Record<string, string>; // bKash/Nagad/Upay/iPay/stPay -> "true"/"false"
  };
  partnerAccountDetails: {
    accountNumber: string;   // encrypted
    accountName: string;
    accountCurrency: string;
    productName: string;
    availableBalance: string; // encrypted
  }[];
};

// ---------------------------------------------------------------------------
// Account Validation
// ---------------------------------------------------------------------------
export type MtbAccountValidationRequest = {
  reqId: string;
  accountNo: string; // encrypted
  beneFirstName: string;
  beneLastName: string;
  beneFullName: string;
  accountType: "Bank" | "Wallet";
  accountOwner: string; // "MTB" | "bKash" | "Nagad" | "Upay" | "iPay" | "stPay"
};

export type MtbAccountValidationResponse = {
  accountType: string;
  accountOwner: string;
  accountNo?: string;    // encrypted
  accountName?: string;  // encrypted
  accountStatus?: string;
  dailyTxnCount?: string;
  monthlyTxnCount?: string;
  lastTxnDateTime?: string;
  remarks?: string;
};

// ---------------------------------------------------------------------------
// Bill Information Validation
// ---------------------------------------------------------------------------
export type MtbBillValidationRequest = {
  reqId: string;
  billerId: string; // encrypted
  billType?: string;
  billingCycle?: string;
  billAmount: string; // encrypted
  userMSISDN: string;
  billOwner: string; // e.g. "DESCO-POST"
  billingParams?: Record<string, string>;
};

export type MtbBillValidationResponse = {
  conversationId: string; // encrypted, expires after 5 minutes
  billerId: string;       // encrypted
  billOwner: string;
  billingCycle: string;
  customerName: string;   // encrypted
  departmentId?: string;
  billType: string;
  billAmountDetails: {
    billAmount: string;
    meterCharge?: string;
    sourceTax?: string;
    surChargeAmount?: string;
    vatAmount?: string;
    tariffAmount?: string;
    totalAmount: string;
  };
  dueDate?: string;
  issueDate?: string;
  locationCode?: string;
};

// ---------------------------------------------------------------------------
// Payment Request
// ---------------------------------------------------------------------------
export type MtbRemitType = "WE01" | "SR02" | "UR03" | "GR04";
export type MtbTranMode = "MTB" | "OTHERBANK" | "CASH" | "WALLET" | "UTILITY";

export type MtbPaymentInfo = {
  remitType: MtbRemitType;
  tranAmount: string;         // encrypted, 2 decimal points
  originatingCurrency: string;
  forexRate: string;
  originatingAmount: string;
  sourceOfFund: string;
  purposeOfFund: string;
  tranRemarks?: string;
};

export type MtbSenderInfo = {
  senderName: string;
  senderPhone: string;
  senderGender: "M" | "F" | "N";
  senderOccupation: string;
  senderNationality: string; // ISO alpha-2
  senderAddressDtls: {
    sendingCountry: string; // ISO alpha-2
    senderDistrict?: string;
    senderAddress: string;
  };
};

export type MtbBeneficiaryInfo = {
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryGender: "M" | "F" | "N";
  beneficiaryOccupation: string;
  beneficiaryAddress: string;
  beneRelationship: string;
};

// Distributive Omit — the built-in Omit<T, K> does NOT distribute over a
// union (it's Pick<T, Exclude<keyof T, K>>, which collapses the union's
// keys first), which breaks discriminated-union narrowing after Omit.
// This variant re-distributes over each member of the union.
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type MtbPaymentRequestBase = {
  reqId: string;
  referenceNumber: string; // encrypted, unique per partner for its whole lifecycle
  paymentInfo: MtbPaymentInfo;
  senderInfo: MtbSenderInfo;
  beneficiaryInfo: MtbBeneficiaryInfo;
};

export type MtbPaymentRequest =
  | (MtbPaymentRequestBase & {
      tranMode: "MTB";
      mtbAccount: { beneficiaryAccount: string };
    })
  | (MtbPaymentRequestBase & {
      tranMode: "OTHERBANK";
      otherBank: {
        tranChannel: "BEFTN" | "NPSB" | "RTGS";
        beneficiaryAccount: string;
        bankName?: string;
        branchName?: string;
        routingNumber: string;
      };
    })
  | (MtbPaymentRequestBase & {
      tranMode: "CASH";
    })
  | (MtbPaymentRequestBase & {
      tranMode: "WALLET";
      walletAccount: {
        beneficiaryAccount: string;
        accountOwner: string; // bKash/Nagad/Upay/iPay/stPay
        senderInfoExtended?: {
          sendingCorridor?: string;
          senderFirstName: string;
          senderLastName: string;
          senderDob?: string;
          senderPob?: string;
          documentType?: string;
          documentNumber?: string;
          idIssueDate?: string;
          idExpiryDate?: string;
        };
        paymentInstrumentInfo?: {
          piType?: string;
          piEntity: string;
          piNumber?: string;
          piCity?: string;
          piZipCode?: string;
          piMisscellExpiry?: string;
          piPayonDate?: string;
          piMessage?: string;
        };
      };
    })
  | (MtbPaymentRequestBase & {
      tranMode: "UTILITY";
      utilityCollection: { billOwner: string; billConversationId: string };
    });

export type MtbPaymentResponse = {
  pinNumber: string;    // encrypted — this is the providerRef
  paymentMode: MtbTranMode;
  paymentOwner: string;
  paymentType: "REGULAR" | "RETURN";
  paymentState: "ACCEPTED" | "FAILED";
  paymentStateDesc: string;
};

// ---------------------------------------------------------------------------
// Status Query
// ---------------------------------------------------------------------------
export type MtbStatusQueryRequest = {
  reqId: string;
  page: string;
  referenceNumber?: string;
  fromDate?: string; // YYYYMMDD
  toDate?: string;   // YYYYMMDD
  paymentMode?: string;
  paymentOwner?: string;
  paymentState?: string;
  sortBy?: "ASC" | "DESC";
};

export type MtbTransactionDetail = {
  statusCode: string;    // encrypted
  pinNumber: string;     // encrypted
  paymentAmount: string; // encrypted
  paymentMode: MtbTranMode;
  paymentOwner: string;
  paymentType: "REGULAR" | "RETURN";
  paymentState: "ACCEPTED" | "LOCKED" | "EXECUTED" | "COMPLETED" | "FAILED" | "CANCELED" | "RETURNED" | "REVERSED";
  paymentStateDesc: string;
  paymentDate: string; // YYYYMMDDHH24MISS
};

export type MtbStatusQueryResponse = {
  contentDetails: {
    currentPage: string;
    totalPages: string;
    pageSize: string;
    trxCount: string;
    totalTrxCount: string;
  };
  transactionDetails: MtbTransactionDetail[];
};

// ---------------------------------------------------------------------------
// Account Statement
// ---------------------------------------------------------------------------
export type MtbAccountStatementRequest = {
  reqId: string;
  accountNumber: string; // encrypted
  fromDate: string; // YYYYMMDD
  toDate: string;   // YYYYMMDD
  sortBy: "ASC" | "DESC";
};

export type MtbStatementLine = {
  transactionDate: string; // DD-MM-YYYY HH24:MI
  withdraw: string;
  deposit: string;
  transactionType: "Debit" | "Credit";
  narration: string;
  currentBalance: string;
};

export type MtbAccountStatementResponse = {
  transactionList: MtbStatementLine[];
};
