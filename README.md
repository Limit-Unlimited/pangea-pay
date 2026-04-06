# Pangea Pay

> *One connected world — no borders, no limits.*

## Project Overview

**Pangea Pay** is a proprietary modular payments technology suite developed by Limit Unlimited Technologies Ltd. It enables regulated financial institutions to offer remittance, wallet, multi-currency account, virtual account, FX, payment processing, compliance, treasury, and reporting capabilities through a unified product architecture.

The platform is designed for commercial deployment to third-party regulated institutions under SaaS, licensed, hosted, or outright sale models, in addition to internal operational use.

Full requirements: `requirements-v2.md`

---

## Applications in Scope

The **Pangea Suite** consists of five applications:

| App | Type | Primary Audience |
|---|---|---|
| **Pangea Backoffice** | Secure web app | Internal staff — operations, compliance, treasury, finance, admin |
| **Pangea Web App** | Secure web app | End customers — onboarding, wallets, payments, tracking |
| **Pangea Mobile App** | iOS & Android | End customers — same journeys as the Web App, mobile context |
| **Pangea Payment Rail** | Public REST API + docs | Aggregator clients and institutional API consumers |
| **Pangea Commercial Management Portal** | Secure web app | Limit Unlimited — institutional customer, subscription, and licence management |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL (dedicated per institutional customer) |
| Frontend | React / Next.js |
| Styling | Tailwind CSS |
| Component Library | shadcn/ui (Radix UI primitives) |

---

## Architecture Model

Each institutional customer operates in a **dedicated application environment with a dedicated database**. The platform uses a shared core business services layer across the Backoffice, Web App, Mobile App, and Payment Rail to ensure consistent business rules, pricing, compliance outcomes, and status transitions across all channels.

---

## Development Timeline

Development starts: **Monday, 7 April 2026**

The timeline below assumes parallel workstreams across backend, frontend, and mobile tracks. Final delivery dates are indicative and subject to team resourcing and sprint review.

### Phase 1 — Foundation and Infrastructure
**Apr 7 – Apr 25, 2026**

- Repository structure and CI/CD pipelines
- Infrastructure provisioning (dedicated-per-customer environment model)
- Core database schema baseline
- Shared authentication and session framework
- Design system setup (Tailwind, shadcn/ui, typography, colour tokens)
- API gateway and integration scaffolding

---

### Phase 2 — Backoffice: Platform Core
**Apr 14 – May 16, 2026**

- Global Settings and platform configuration (2.1)
- User and Role Management (2.2)
- Permission model and access control framework
- Core navigation and Backoffice shell

---

### Phase 3 — Customer Lifecycle and Onboarding
**May 4 – Jun 13, 2026**

- Customer and Customer User Management (2.3)
- Onboarding and Verification Operations queue (2.16)
- Document and Communication Management (2.11)
- Customer Support and Query Management (2.17)

---

### Phase 4 — Accounts, Wallets, Virtual Accounts, and Beneficiaries
**Jun 1 – Jul 11, 2026**

- Wallet and Current Account Management (2.4)
- Virtual Account Management (2.5)
- Beneficiary and Counterparty Management (2.6)

---

### Phase 5 — FX, Pricing, Payments, and Transactions
**Jun 22 – Aug 1, 2026**

- FX and Pricing Management (2.7)
- Payment and Transaction Operations (2.8)
- Transaction lifecycle, approval workflows, and operational queues

---

### Phase 6 — Compliance and Risk
**Jul 6 – Aug 15, 2026**

- AML / CTF / Fraud and Case Management (2.10)
- Integration Management (2.13)
- Screening workflows and alert management

---

### Phase 7 — Financial Controls
**Jul 20 – Sep 12, 2026**

- Treasury, Safeguarding, and Nostro Management (2.9)
- Accounting and Ledger Management (2.12)
- Settlement and Reconciliation Management (2.15)

---

### Phase 8 — Reporting and Audit
**Aug 10 – Sep 19, 2026**

- Reports and Audit framework (2.14)
- Dashboards and MI views
- Scheduled reporting and export controls

---

### Phase 9 — Web App Customer Journeys
**May 4 – Aug 22, 2026** *(parallel with Phases 3–5)*

- Registration, onboarding, and identity verification (3.1–3.2)
- Wallet and account access (3.3–3.4)
- Beneficiary management (3.5)
- FX quote and conversion (3.6)
- Payments, transfers, and remittance initiation (3.7)
- Transaction and activity tracking (3.8)
- Statements, documents, and communication (3.9)
- Profile, preferences, and security (3.10–3.12)

---

### Phase 10 — Mobile App (iOS and Android)
**Jun 29 – Sep 19, 2026** *(parallel with Phases 5–7)*

- All customer journeys from Phase 9 adapted for mobile
- Mobile-native experience: biometric auth, camera capture, push notifications
- iOS and Android builds

---

### Phase 11 — Pangea Payment Rail
**Jul 6 – Sep 12, 2026** *(parallel with Phases 6–7)*

- Authentication and API consumer management (5.1–5.3)
- Customer, beneficiary, quote, account, and payment API services (5.4–5.8)
- Webhooks, callbacks, and event delivery (5.10)
- Reporting and reconciliation endpoints (5.11)
- API standards, idempotency, versioning, and rate limiting (5.12–5.13)
- HTML API documentation and sandbox environment (5.14)

---

### Phase 12 — Commercial Management Portal
**Aug 3 – Sep 26, 2026** *(parallel with Phases 8–11)*

- Institutional customer management and commercial lifecycle (1.1–1.4)
- Tenant provisioning and environment management (1.5)
- Billing configuration and usage tracking (1.6–1.7)
- Commercial status controls, white-labelling, and support entitlements (1.8–1.11)
- Commercial audit and reporting (1.12)

---

### Phase 13 — Integration Testing and UAT
**Sep 14 – Nov 7, 2026**

- End-to-end integration testing across all five applications
- User acceptance testing with operations, compliance, treasury, and customer support teams
- API consumer integration testing (Payment Rail)
- Regression testing and defect resolution

---

### Phase 14 — Security, Performance, and Hardening
**Oct 12 – Nov 28, 2026**

- Penetration testing and security audit
- Performance and load testing against indicative targets (API P95 < 500ms, availability ≥ 99.9%)
- DR and recovery testing
- Monitoring, alerting, and observability configuration
- Final bug fixes and hardening

---

### Phase 15 — Go-Live Preparation
**Nov 9 – Nov 28, 2026**

- Production environment readiness review
- Operational runbook and support documentation
- Staff training and onboarding
- Soft launch and controlled rollout preparation

---

### Target Production Launch
**December 2026**

---

## Competitive Landscape

The following players were researched as reference points during the naming and scoping phase:

| App | Focus |
|---|---|
| Wise | Low-cost, transparent global transfers |
| Remitly | B2C remittance, family transfers |
| WorldRemit | Multi-corridor, 130+ countries |
| NALA | Africa-focused remittance |
| LemFi | West & East Africa, neobank features |
| Airwallex | B2B cross-border payments |
| TapTap Send | Transparent fees, mobile wallets |
| Revolut | Multi-currency neobank |
| Xoom (PayPal) | 160+ country transfers |

---

## Naming Decision

**Selected Name:** Pangea Pay

**Rationale:** Pangea refers to the ancient supercontinent — a single, unified landmass. The name conveys the platform's core mission: making the world feel like one connected place where money moves freely across borders.

**Runners-up considered:** Voya, Fluxa, Corvia, Remify, Xendly

---

*BRS completed: April 2026 — Development start: 7 April 2026*
