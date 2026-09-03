import { NextResponse } from "next/server";

// GET /api/openapi.json — OpenAPI 3.1 specification for the Pangea Payment Rail
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Pangea Payment Rail",
      version: "1.0.0",
      description: "Public API for authorised payment aggregators and institutional partners. All endpoints require OAuth 2.0 client_credentials bearer tokens.",
      contact: { name: "Pangea Rail Support", email: "api@pangea-pay.com" },
    },
    servers: [{ url: "/api", description: "This server" }],

    security: [{ bearerAuth: [] }],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "opaque",
          description: "Obtain a token via POST /api/oauth/token (client_credentials grant).",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            error_description: { type: "string" },
          },
          required: ["error"],
        },
        Customer: {
          type: "object",
          properties: {
            id:               { type: "string", format: "uuid" },
            customerRef:      { type: "string", example: "CUST-000001" },
            type:             { type: "string", enum: ["individual", "business"] },
            status:           { type: "string", enum: ["prospect", "onboarding", "active", "suspended", "closed", "archived"] },
            onboardingStatus: { type: "string", enum: ["pending", "under_review", "approved", "rejected"] },
            riskCategory:     { type: "string", enum: ["low", "medium", "high"] },
            firstName:        { type: "string", nullable: true },
            lastName:         { type: "string", nullable: true },
            legalEntityName:  { type: "string", nullable: true },
            email:            { type: "string", nullable: true },
            phone:            { type: "string", nullable: true },
            country:          { type: "string", example: "GB" },
            screeningStatus:  { type: "string" },
            createdAt:        { type: "string", format: "date-time" },
          },
        },
        Beneficiary: {
          type: "object",
          properties: {
            id:            { type: "string", format: "uuid" },
            displayName:   { type: "string" },
            firstName:     { type: "string", nullable: true },
            lastName:      { type: "string", nullable: true },
            phone:         { type: "string", nullable: true },
            gender:        { type: "string", enum: ["M", "F", "N"], nullable: true },
            occupation:    { type: "string", nullable: true },
            payoutType:    { type: "string", enum: ["bank_account", "cash_pickup", "wallet", "utility_biller"], default: "bank_account" },
            bankName:      { type: "string", nullable: true },
            accountNumber: { type: "string", nullable: true, description: "For payoutType=utility_biller, this holds the customer's own reference/account number at the biller." },
            iban:          { type: "string", nullable: true },
            sortCode:      { type: "string", nullable: true },
            swiftBic:      { type: "string", nullable: true },
            bankTransferChannel: { type: "string", enum: ["internal", "beftn", "rtgs", "npsb"], nullable: true, description: "internal = own-bank transfer; otherwise the interbank channel used." },
            bankRoutingNumber:   { type: "string", nullable: true, description: "Required when bankTransferChannel is not \"internal\"." },
            walletProvider: { type: "string", nullable: true, example: "bkash", description: "Required for payoutType=wallet." },
            walletMsisdn:   { type: "string", nullable: true, description: "Required for payoutType=wallet." },
            utilityBillerCode: { type: "string", nullable: true, description: "Required for payoutType=utility_biller." },
            currency:      { type: "string", example: "EUR" },
            country:       { type: "string", example: "DE" },
            status:        { type: "string", enum: ["active", "flagged", "blocked"] },
            createdAt:     { type: "string", format: "date-time" },
          },
        },
        Quote: {
          type: "object",
          properties: {
            id:               { type: "string", format: "uuid" },
            customerRef:      { type: "string" },
            from:             { type: "string", example: "GBP" },
            to:               { type: "string", example: "EUR" },
            rate:             { type: "number", example: 1.1720 },
            sendAmount:       { type: "number", example: 1000.00 },
            fee:              { type: "number", example: 15.00 },
            receiveAmount:    { type: "number", example: 1152.54 },
            rateDate:         { type: "string", format: "date" },
            expiresAt:        { type: "string", format: "date-time" },
            expiresInSeconds: { type: "integer", example: 30 },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id:              { type: "string", format: "uuid" },
            referenceNumber: { type: "string", example: "TXN-000001" },
            status:          { type: "string", enum: ["initiated", "pending", "processing", "on_hold", "completed", "failed", "cancelled", "refunded"], description: "\"pending\"/\"processing\" while a provider is still settling the payment — the create response is never the final state; poll this endpoint." },
            sendAmount:      { type: "string" },
            sendCurrency:    { type: "string" },
            receiveAmount:   { type: "string", nullable: true },
            receiveCurrency: { type: "string", nullable: true },
            fxRate:          { type: "string", nullable: true },
            fee:             { type: "string" },
            feeCurrency:     { type: "string" },
            providerRef:     { type: "string", nullable: true, description: "Null until the payout provider has actually accepted the payment — providers may settle asynchronously." },
            remitPurpose:    { type: "string", enum: ["wage_earner", "service_export", "utility_bill", "goods_export"], nullable: true, example: "wage_earner" },
            beneficiaryRelationship: { type: "string", nullable: true, example: "self" },
            failureReason:   { type: "string", nullable: true },
            completedAt:     { type: "string", format: "date-time", nullable: true },
            failedAt:        { type: "string", format: "date-time", nullable: true },
            createdAt:       { type: "string", format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Unauthorized" },
            },
          },
        },
      },
    },

    paths: {
      "/oauth/token": {
        post: {
          summary: "Issue a client credentials access token",
          tags: ["Auth"],
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/x-www-form-urlencoded": {
                schema: {
                  type: "object",
                  required: ["grant_type", "client_id", "client_secret"],
                  properties: {
                    grant_type:    { type: "string", enum: ["client_credentials"] },
                    client_id:     { type: "string" },
                    client_secret: { type: "string" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  required: ["grant_type", "client_id", "client_secret"],
                  properties: {
                    grant_type:    { type: "string", enum: ["client_credentials"] },
                    client_id:     { type: "string" },
                    client_secret: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Access token issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      access_token: { type: "string" },
                      token_type:   { type: "string", example: "Bearer" },
                      expires_in:   { type: "integer", example: 3600 },
                      scope:        { type: "string" },
                    },
                  },
                  example: {
                    access_token: "pgn_at_9f8c2e1b4a7d4f5e9c0b1a2d3e4f5a6b",
                    token_type: "Bearer",
                    expires_in: 3600,
                    scope: "quotes:read payments:write payments:read customers:read beneficiaries:read beneficiaries:write",
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or unsupported grant type",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "unsupported_grant_type" } } },
            },
            "401": {
              description: "Invalid client credentials",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "invalid_client" } } },
            },
          },
        },
      },

      "/v1/customers/{ref}": {
        get: {
          summary: "Look up a customer by their reference number",
          tags: ["Customers"],
          parameters: [{ in: "path", name: "ref", required: true, schema: { type: "string" }, example: "CUST-000001" }],
          responses: {
            "200": {
              description: "Customer found",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Customer" } } },
                  example: {
                    data: {
                      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", customerRef: "CUST-000001", type: "individual",
                      status: "active", onboardingStatus: "approved", riskCategory: "low",
                      firstName: "Cyprian", lastName: "Gomes", legalEntityName: null,
                      email: "cyprian@dvive.com", phone: "+447545839711", country: "GB",
                      screeningStatus: "clear", createdAt: "2026-04-21T00:00:00.000Z",
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Customer not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Customer not found" } } },
            },
          },
        },
      },

      "/v1/beneficiaries": {
        get: {
          summary: "List beneficiaries for a customer",
          tags: ["Beneficiaries"],
          parameters: [{ in: "query", name: "customerRef", required: true, schema: { type: "string" }, example: "CUST-000001" }],
          responses: {
            "200": {
              description: "Beneficiary list",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Beneficiary" } } } },
                  example: {
                    data: [
                      {
                        id: "b2b1c3d4-5717-4562-b3fc-2c963f66af01", displayName: "Jamal Bhuiya", firstName: "Jamal", lastName: "Bhuiya",
                        phone: "+8801712345678", gender: "M", occupation: null,
                        payoutType: "wallet", bankName: null, accountNumber: null, iban: null, sortCode: null, swiftBic: null,
                        bankTransferChannel: null, bankRoutingNumber: null, walletProvider: "bkash", walletMsisdn: "+8801712345678",
                        utilityBillerCode: null, currency: "BDT", country: "BD", status: "active", createdAt: "2026-08-20T09:12:00.000Z",
                      },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Add a beneficiary for a customer",
          description: "payoutType determines which fields are required beyond the base set:\n" +
            "- bank_account (default): iban or accountNumber. If bankTransferChannel is beftn/rtgs/npsb (not internal), bankRoutingNumber is also required.\n" +
            "- wallet: walletProvider and walletMsisdn.\n" +
            "- utility_biller: utilityBillerCode and accountNumber (the customer's own reference at the biller).\n" +
            "- cash_pickup: no additional fields.",
          tags: ["Beneficiaries"],
          parameters: [{ in: "header", name: "Idempotency-Key", schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["customerRef", "displayName", "currency", "country"],
                  properties: {
                    customerRef:   { type: "string" },
                    displayName:   { type: "string" },
                    firstName:     { type: "string" },
                    lastName:      { type: "string" },
                    phone:         { type: "string" },
                    gender:        { type: "string", enum: ["M", "F", "N"] },
                    occupation:    { type: "string" },
                    payoutType:    { type: "string", enum: ["bank_account", "cash_pickup", "wallet", "utility_biller"], default: "bank_account" },
                    bankName:      { type: "string" },
                    accountNumber: { type: "string" },
                    iban:          { type: "string" },
                    sortCode:      { type: "string" },
                    swiftBic:      { type: "string" },
                    bankTransferChannel: { type: "string", enum: ["internal", "beftn", "rtgs", "npsb"] },
                    bankRoutingNumber:   { type: "string" },
                    walletProvider: { type: "string", example: "bkash" },
                    walletMsisdn:   { type: "string" },
                    utilityBillerCode: { type: "string" },
                    currency:      { type: "string", example: "EUR" },
                    country:       { type: "string", example: "DE" },
                  },
                },
                examples: {
                  bankAccount: {
                    summary: "Bank beneficiary (default)",
                    value: {
                      customerRef: "CUST-000001",
                      displayName: "Hans Mueller",
                      firstName: "Hans",
                      lastName: "Mueller",
                      bankName: "Deutsche Bank",
                      iban: "DE89370400440532013000",
                      swiftBic: "DEUTDEDBBER",
                      currency: "EUR",
                      country: "DE",
                    },
                  },
                  otherBankChannel: {
                    summary: "Bank beneficiary via BEFTN/RTGS/NPSB",
                    value: {
                      customerRef: "CUST-000001",
                      displayName: "Jamal Bhuiya",
                      payoutType: "bank_account",
                      bankTransferChannel: "beftn",
                      accountNumber: "1311000773294",
                      bankName: "Brac Bank Limited",
                      bankRoutingNumber: "060270688",
                      currency: "BDT",
                      country: "BD",
                    },
                  },
                  wallet: {
                    summary: "Mobile wallet beneficiary",
                    value: {
                      customerRef: "CUST-000001",
                      displayName: "Jamal Bhuiya",
                      phone: "+8801712345678",
                      payoutType: "wallet",
                      walletProvider: "bkash",
                      walletMsisdn: "+8801712345678",
                      currency: "BDT",
                      country: "BD",
                    },
                  },
                  utilityBiller: {
                    summary: "Utility biller beneficiary",
                    value: {
                      customerRef: "CUST-000001",
                      displayName: "DESCO — Postpaid",
                      payoutType: "utility_biller",
                      utilityBillerCode: "DESCO-POST",
                      accountNumber: "123456789",
                      currency: "BDT",
                      country: "BD",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Beneficiary created",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "object", properties: { id: { type: "string", format: "uuid" } } } } },
                  example: { data: { id: "b2b1c3d4-5717-4562-b3fc-2c963f66af01" } },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "walletProvider and walletMsisdn are required for a wallet beneficiary" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Customer not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Customer not found" } } },
            },
          },
        },
      },

      "/v1/beneficiaries/{id}": {
        get: {
          summary: "Get a beneficiary by ID",
          tags: ["Beneficiaries"],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": {
              description: "Beneficiary",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Beneficiary" } } },
                  example: {
                    data: {
                      id: "b2b1c3d4-5717-4562-b3fc-2c963f66af01", displayName: "Jamal Bhuiya", firstName: "Jamal", lastName: "Bhuiya",
                      phone: "+8801712345678", gender: "M", occupation: null,
                      payoutType: "wallet", bankName: null, accountNumber: null, iban: null, sortCode: null, swiftBic: null,
                      bankTransferChannel: null, bankRoutingNumber: null, walletProvider: "bkash", walletMsisdn: "+8801712345678",
                      utilityBillerCode: null, currency: "BDT", country: "BD", status: "active", createdAt: "2026-08-20T09:12:00.000Z",
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Beneficiary not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Beneficiary not found" } } },
            },
          },
        },
        delete: {
          summary: "Remove a beneficiary (soft block)",
          tags: ["Beneficiaries"],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "204": { description: "Deleted" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Beneficiary not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Beneficiary not found" } } },
            },
          },
        },
      },

      "/v1/quotes": {
        post: {
          summary: "Request a live FX quote",
          tags: ["Quotes"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["customerRef", "from", "to", "amount"],
                  properties: {
                    customerRef: { type: "string", example: "CUST-000001" },
                    from:        { type: "string", example: "GBP" },
                    to:          { type: "string", example: "EUR" },
                    amount:      { type: "number", example: 1000 },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Quote generated",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Quote" } } },
                  example: {
                    data: {
                      id: "9c4b2a1d-5717-4562-b3fc-2c963f66af02", customerRef: "CUST-000001", from: "GBP", to: "BDT",
                      rate: 148.2100, sendAmount: 500.00, fee: 7.50, receiveAmount: 74105.00,
                      rateDate: "2026-09-03", expiresAt: "2026-09-03T12:05:00.000Z", expiresInSeconds: 30,
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "from and to currencies must differ" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "503": {
              description: "FX service unavailable",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Exchange rate service unavailable. Please try again." } } },
            },
          },
        },
      },

      "/v1/payments": {
        post: {
          summary: "Submit a payment",
          description: "Creates the payment and returns immediately with providerRef null and status \"pending\" — submission to the payout provider happens asynchronously (this is not a synchronous rail). Poll GET /v1/payments/{ref} or listen for the payment.completed / payment.failed webhook for the final outcome.\n\n" +
            "remitPurpose, beneficiaryRelationship, senderGender and senderOccupation are only required when the resolved beneficiary routes through a provider that needs them (e.g. MTB); senderGender/senderOccupation fall back to the customer's own profile when omitted.",
          tags: ["Payments"],
          parameters: [{ in: "header", name: "Idempotency-Key", schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["customerRef", "beneficiaryId", "sendAmount", "sendCurrency"],
                  properties: {
                    customerRef:   { type: "string", example: "CUST-000001" },
                    beneficiaryId: { type: "string", format: "uuid" },
                    sendAmount:    { type: "number", example: 1000 },
                    sendCurrency:  { type: "string", example: "GBP" },
                    quoteId:       { type: "string", format: "uuid", description: "Optional FX quote ID from POST /v1/quotes" },
                    purposeCode:   { type: "string", example: "PERSONAL" },
                    externalRef:   { type: "string", description: "Consumer's own reference / reconciliation key" },
                    remitPurpose:  { type: "string", enum: ["wage_earner", "service_export", "utility_bill", "goods_export"], example: "wage_earner" },
                    beneficiaryRelationship: { type: "string", example: "self" },
                    senderGender:     { type: "string", enum: ["M", "F", "N"] },
                    senderOccupation: { type: "string" },
                  },
                },
                examples: {
                  simple: {
                    summary: "Simple bank-transfer payment",
                    value: {
                      customerRef: "CUST-000001",
                      beneficiaryId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                      sendAmount: 500,
                      sendCurrency: "GBP",
                    },
                  },
                  remittance: {
                    summary: "Wage-earner remittance with full sender/beneficiary context",
                    value: {
                      customerRef: "CUST-000001",
                      beneficiaryId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                      sendAmount: 500,
                      sendCurrency: "GBP",
                      purposeCode: "Family support",
                      externalRef: "PARTNER-REF-00931",
                      remitPurpose: "wage_earner",
                      beneficiaryRelationship: "parent",
                      senderGender: "M",
                      senderOccupation: "Service",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Payment accepted for processing",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          referenceNumber: { type: "string", example: "TXN-000001" },
                          transactionId:   { type: "string", format: "uuid" },
                          providerRef:     { type: "string", nullable: true, description: "Null until the provider accepts the payment — see GET /v1/payments/{ref}." },
                          status:          { type: "string", example: "pending" },
                        },
                      },
                    },
                  },
                  example: {
                    data: {
                      referenceNumber: "TXN-000042",
                      transactionId: "5e8f1a2b-5717-4562-b3fc-2c963f66af03",
                      providerRef: null,
                      status: "pending",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Invalid request" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Customer or beneficiary not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Beneficiary not found" } } },
            },
            "422": {
              description: "Business rule violation",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Customer account is not approved" } } },
            },
          },
        },
      },

      "/v1/payments/{ref}": {
        get: {
          summary: "Get payment status by reference number",
          tags: ["Payments"],
          parameters: [{ in: "path", name: "ref", required: true, schema: { type: "string" }, example: "TXN-000001" }],
          responses: {
            "200": {
              description: "Payment details",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Payment" } } },
                  example: {
                    data: {
                      id: "5e8f1a2b-5717-4562-b3fc-2c963f66af03", referenceNumber: "TXN-000042", type: "send", status: "processing",
                      sendAmount: "500.0000", sendCurrency: "GBP", receiveAmount: "74105.0000", receiveCurrency: "BDT",
                      fxRate: "148.21000000", fee: "7.5000", feeCurrency: "GBP",
                      providerRef: "R00874421", providerName: "mtb",
                      remitPurpose: "wage_earner", beneficiaryRelationship: "parent",
                      holdReason: null, failureReason: null,
                      completedAt: null, failedAt: null, cancelledAt: null,
                      createdAt: "2026-09-03T11:58:02.000Z", updatedAt: "2026-09-03T12:01:47.000Z",
                      customerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", beneficiaryId: "b2b1c3d4-5717-4562-b3fc-2c963f66af01",
                      customerRef: "CUST-000001",
                      beneficiary: { id: "b2b1c3d4-5717-4562-b3fc-2c963f66af01", displayName: "Jamal Bhuiya", currency: "BDT", country: "BD" },
                      statusHistory: [
                        { fromStatus: "pending", toStatus: "processing", reason: "Submitted to MTB", createdAt: "2026-09-03T12:01:47.000Z" },
                        { fromStatus: null, toStatus: "pending", reason: "Payment initiated", createdAt: "2026-09-03T11:58:02.000Z" },
                      ],
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Payment not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Payment not found" } } },
            },
          },
        },
      },

      "/webhooks/process": {
        post: {
          summary: "Trigger delivery of pending webhook events",
          tags: ["Webhooks"],
          description: "Processes all pending/failed webhook events due for retry. Can be called by a cron job (with X-Cron-Secret + X-Tenant-Id headers) or by an authenticated consumer.\n\n" +
            "Event types: payment.submitted, payment.completed, payment.failed. Each delivery is a POST to your configured webhookUrl, signed with HMAC-SHA256 over `{timestamp}.{body}` using your webhookSecret, sent as X-Pangea-Signature alongside X-Pangea-Event, X-Pangea-Timestamp and X-Pangea-Delivery-Id. Undelivered events retry on a backoff of 30s, 2m, 10m, 30m, 2h before being abandoned.",
          responses: {
            "200": {
              description: "Events processed",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { processed: { type: "integer" } } },
                  example: { processed: 3 },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
    },

    tags: [
      { name: "Auth",          description: "Token issuance" },
      { name: "Customers",     description: "Customer lookup" },
      { name: "Beneficiaries", description: "Beneficiary management" },
      { name: "Quotes",        description: "FX rate quotes" },
      { name: "Payments",      description: "Payment submission and status" },
      { name: "Webhooks",      description: "Webhook delivery management" },
    ],
  };

  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
