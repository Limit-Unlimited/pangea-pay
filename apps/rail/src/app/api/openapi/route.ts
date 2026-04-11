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
            bankName:      { type: "string", nullable: true },
            accountNumber: { type: "string", nullable: true },
            iban:          { type: "string", nullable: true },
            sortCode:      { type: "string", nullable: true },
            swiftBic:      { type: "string", nullable: true },
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
            status:          { type: "string", enum: ["initiated", "pending", "processing", "on_hold", "completed", "failed", "cancelled", "refunded"] },
            sendAmount:      { type: "string" },
            sendCurrency:    { type: "string" },
            receiveAmount:   { type: "string", nullable: true },
            receiveCurrency: { type: "string", nullable: true },
            fxRate:          { type: "string", nullable: true },
            fee:             { type: "string" },
            feeCurrency:     { type: "string" },
            providerRef:     { type: "string" },
            failureReason:   { type: "string", nullable: true },
            completedAt:     { type: "string", format: "date-time", nullable: true },
            failedAt:        { type: "string", format: "date-time", nullable: true },
            createdAt:       { type: "string", format: "date-time" },
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
                },
              },
            },
            "400": { description: "Invalid request or unsupported grant type" },
            "401": { description: "Invalid client credentials" },
          },
        },
      },

      "/v1/customers/{ref}": {
        get: {
          summary: "Look up a customer by their reference number",
          tags: ["Customers"],
          parameters: [{ in: "path", name: "ref", required: true, schema: { type: "string" }, example: "CUST-000001" }],
          responses: {
            "200": { description: "Customer found", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Customer" } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Customer not found" },
          },
        },
      },

      "/v1/beneficiaries": {
        get: {
          summary: "List beneficiaries for a customer",
          tags: ["Beneficiaries"],
          parameters: [{ in: "query", name: "customerRef", required: true, schema: { type: "string" }, example: "CUST-000001" }],
          responses: {
            "200": { description: "Beneficiary list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Beneficiary" } } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          summary: "Add a beneficiary for a customer",
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
                    bankName:      { type: "string" },
                    accountNumber: { type: "string" },
                    iban:          { type: "string" },
                    sortCode:      { type: "string" },
                    swiftBic:      { type: "string" },
                    currency:      { type: "string", example: "EUR" },
                    country:       { type: "string", example: "DE" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Beneficiary created", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { id: { type: "string", format: "uuid" } } } } } } } },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Customer not found" },
          },
        },
      },

      "/v1/beneficiaries/{id}": {
        get: {
          summary: "Get a beneficiary by ID",
          tags: ["Beneficiaries"],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Beneficiary", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Beneficiary" } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Beneficiary not found" },
          },
        },
        delete: {
          summary: "Remove a beneficiary (soft block)",
          tags: ["Beneficiaries"],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "204": { description: "Deleted" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Beneficiary not found" },
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
            "201": { description: "Quote generated", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Quote" } } } } } },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "503": { description: "FX service unavailable" },
          },
        },
      },

      "/v1/payments": {
        post: {
          summary: "Submit a payment",
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
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Payment submitted",
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
                          providerRef:     { type: "string" },
                          status:          { type: "string", example: "pending" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Customer or beneficiary not found" },
            "422": { description: "Business rule violation" },
          },
        },
      },

      "/v1/payments/{ref}": {
        get: {
          summary: "Get payment status by reference number",
          tags: ["Payments"],
          parameters: [{ in: "path", name: "ref", required: true, schema: { type: "string" }, example: "TXN-000001" }],
          responses: {
            "200": { description: "Payment details", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Payment" } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { description: "Payment not found" },
          },
        },
      },

      "/webhooks/process": {
        post: {
          summary: "Trigger delivery of pending webhook events",
          tags: ["Webhooks"],
          description: "Processes all pending/failed webhook events due for retry. Can be called by a cron job (with X-Cron-Secret + X-Tenant-Id headers) or by an authenticated consumer.",
          responses: {
            "200": {
              description: "Events processed",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { processed: { type: "integer" } } },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: "Missing or invalid bearer token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
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
