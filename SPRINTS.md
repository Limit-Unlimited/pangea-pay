# Pangea Pay — MVP Sprint Plan

**Version:** 1.2  
**Date:** 2026-04-06  
**Original Target:** 2026-10-02 (26 weeks)  
**Revised Target:** 2026-06-26 (realistic) · 2026-06-05 (optimistic)  
**Duration:** ~12 weeks remaining from 2026-04-07 · sprint length now reflects actual delivery pace  
**Methodology:** Continuous delivery — sprints sized by feature complexity, not calendar time  
**Team:** Limit Unlimited Technologies Ltd  
**Git Author:** capg84

---

## Timeline Revision — v1.2 (2026-04-06)

### What Happened

The original plan was drafted assuming a 6-person human team working at a conventional pace of one 2-week sprint per fortnight. It produced a 26-week (13-sprint) schedule targeting **2026-10-02**.

On the first day of development (2026-04-06), both Sprint 0 and Sprint 1 were completed in approximately 10 hours of total work:

| Sprint | Planned Duration | Actual Duration | Completed |
|---|---|---|---|
| Sprint 0 — Foundation & Infrastructure | 2 weeks | ~4 hours | 2026-04-06 |
| Sprint 1 — Authentication & Backoffice Shell | 2 weeks | ~6 hours | 2026-04-06 |

Four weeks of planned work delivered in a single day.

### Why the Early Sprints Were Faster Than Planned

Sprint 0 and Sprint 1 were disproportionately fast for two reasons:

**1. Infrastructure and scaffolding are AI-native tasks.** Setting up a monorepo, configuring TypeScript, initialising shadcn/ui, wiring NextAuth, and creating database schemas are deterministic, well-documented tasks with clear correct answers. There is no ambiguity, no stakeholder alignment required, and no design iteration — just execution. These tasks compress dramatically when the bottleneck of human context-switching and documentation-reading is removed.

**2. No business logic complexity yet.** Sprint 0 was pure tooling. Sprint 1's authentication logic, while security-sensitive, follows well-established patterns (credentials provider, TOTP, JWT, audit logging). The decisions were architectural, not domain-specific.

### Why the Remaining Sprints Will Take Longer

The complexity profile changes significantly from Sprint 2 onwards. The reasons are structural, not circumstantial:

**Business logic density increases.** Each remaining sprint requires implementing domain-specific rules: pricing engines, double-entry accounting, AML screening workflows, FX quote expiry logic, payment corridor restrictions, reconciliation matching. These are not boilerplate — they require careful modelling against the BRS.

**Screen and component count grows.** Sprint 2 alone covers 14 configuration screens with forms, tables, and audit trails. Sprint 5 covers a full end-to-end payment journey across both Backoffice and Web App simultaneously. The raw volume of UI work increases 4–6× compared to the shell built in Sprint 1.

**Human review gates add real time.** As features become usable — real login, real forms, real payment flows — each sprint requires the product owner to test, validate, and sign off. This is irreducibly human time that does not compress.

**Third-party provider dependencies are a hard external constraint.** Sprint 3 requires a live screening provider sandbox. Sprint 5 requires a working FX rate feed and payout partner connectivity. These require account sign-up, KYC on the business, API credential issuance, and integration testing — none of which are within development control. Provider onboarding typically takes 1–4 weeks per provider.

**Security and financial correctness require iteration.** Double-entry ledger posting, payment idempotency, reconciliation matching, and AML workflows cannot simply be built and shipped. They require testing against realistic scenarios, edge case handling, and review. Sprint 8 (UAT, pen test, go-live) is time-bounded by testing thoroughness, not development speed.

### Revised Complexity and Duration Estimates

| Sprint | Theme | Complexity Driver | Estimated Working Days |
|---|---|---|---|
| Sprint 2 | Global Settings & RBAC | 14 config screens, full permission matrix, many tables | 2–3 days |
| Sprint 3 | Customer Management & Onboarding | Complex profiles, KYC review, live screening integration | 3–4 days |
| Sprint 4 | Wallet/Account + Web App Onboarding | Multi-currency accounts, full customer registration journey | 3–4 days |
| Sprint 5 | Payments & FX | End-to-end payment flow, quote engine, limits — highest complexity | 5–7 days |
| Sprint 6 | Compliance, Treasury & Accounting | Double-entry ledger, AML cases, nostro, safeguarding views | 5–7 days |
| Sprint 7 | Payment Rail API & Integrations | Public API, webhooks, OpenAPI docs, provider hardening | 4–5 days |
| Sprint 8 | Security Audit, UAT & Go-Live | Pen test, performance testing, DR runbook — irreducibly human | 7–10 days |
| **Total remaining** | | | **29–40 working days** |

### Revised Target Dates

| Scenario | Assumption | Target |
|---|---|---|
| **Optimistic** | Daily sessions, no provider delays, no major rework | **2026-06-05** |
| **Realistic** | Some review gaps, provider onboarding causes 1–2 week delay in Sprint 5 | **2026-06-26** |
| **Conservative** | Provider onboarding slips significantly, Sprint 5/6 require iteration | **2026-07-18** |

The realistic target of **26 June 2026** represents a saving of approximately **14 weeks** (54%) against the original 26-week plan.

### Critical Path Warning — Third-Party Providers

The single biggest risk to the revised timeline is provider onboarding. **This is the critical path item and it must start immediately**, regardless of development progress:

| Provider | Needed By | Action Required |
|---|---|---|
| Sanctions / PEP screening provider | Sprint 3 (target Apr 14) | Select provider and begin sign-up this week |
| FX rate feed | Sprint 5 (target May 6) | Select provider and begin API access request |
| Payout / banking partner | Sprint 5 (target May 6) | Begin commercial conversation this week |
| KYC / identity verification | Sprint 4 (target Apr 22) | Select provider and begin sign-up this week |
| Email provider (production) | Sprint 6 (target May 18) | Low urgency — Mailpit handles dev |

Development will continue against mock adapters in all cases, but **live sandbox testing cannot happen until credentials are in hand**. A 3-week delay in provider onboarding translates directly to a 3-week delay in go-live, regardless of how fast the code is written.

---

## MVP Scope Summary

The 4-month MVP delivers three production-ready applications:

| App | In MVP | Notes |
|---|---|---|
| Pangea Backoffice | Yes — core modules | See per-sprint scope below |
| Pangea Web App | Yes — core customer journeys | Registration → Transfer → History |
| Pangea Payment Rail | Yes — core endpoints | Auth, Customer, Payment, Status |
| Pangea Mobile App | No — deferred | Phase 2, target Nov 2026 |
| Pangea Commercial Portal | Partial | Tenant provisioning only |

---

## Team

### Composition

All work on Pangea Pay is conducted by and attributed to **Limit Unlimited Technologies Ltd**. All intellectual property, code, documentation, and design belong exclusively to Limit Unlimited.

| Function | Responsibility |
|---|---|
| Product Owner | All product and priority decisions, third-party contracts, compliance sign-off, UAT |
| Development | All application code: frontend, backend, API, database schema, tests, configuration, integrations |

### Division of Responsibilities

**Product Owner handles:**
- All product and priority decisions
- Creating accounts with third-party providers (KYC, screening, FX, banking partner, email/SMS)
- Providing API keys and credentials via `.env` files
- Regulatory and legal review
- UAT — testing flows as an end user and signing off
- Approving production deployments and all git pushes to remote
- Any financial, legal, or contractual obligation

**Development tooling handles — autonomously between sessions:**
- All application code: Next.js pages, API routes, database schema, migrations, services, hooks, components
- Test files: unit tests, integration tests, E2E test scaffolding
- Configuration: Tailwind, shadcn, environment setup, CI/CD workflows
- Integration implementation: once API keys are provided, the tooling writes the integration code
- Debugging, refactoring, and fixing issues raised in review
- Writing and updating documentation

### Timeline Impact

A 6-person team was assumed in the original 4-month plan. Operating with a lean team and automated development tooling, human review cycles, decision latency, third-party onboarding, and session context create overhead that scales the timeline. The plan has been updated to **26 weeks (13 sprints)** covering the same MVP scope:

- Original estimate (6-person team): 18 weeks
- Adjusted estimate (lean team + tooling): 26 weeks
- Each original sprint is expanded or split where the human review gate is the bottleneck

---

## Development Tooling Configuration

The development tooling runs autonomously — writing code, running builds, committing changes, and managing the project structure. The following configuration controls what it is permitted to do without prompting, and what always requires explicit approval.

### Recommended Project Settings

Create a `.claude/settings.json` file in the project root with the following configuration:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "Agent",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(pnpm *)",
      "Bash(yarn *)",
      "Bash(node *)",
      "Bash(git add *)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git branch*)",
      "Bash(git checkout *)",
      "Bash(git stash*)",
      "Bash(git commit *)",
      "Bash(git merge --no-ff *)",
      "Bash(mkdir *)",
      "Bash(touch *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(echo *)",
      "Bash(curl *)"
    ],
    "deny": [
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(git rebase*)",
      "Bash(git tag*)",
      "Bash(rm -rf*)",
      "Bash(sudo *)",
      "Bash(chmod 777*)",
      "Bash(mysql*)",
      "Bash(psql*)",
      "Bash(dropdb*)",
      "Bash(drop *)"
    ]
  }
}
```

> **Note:** Items in `deny` will always prompt you for approval regardless of any other setting. This is a hard block.

### What This Grants

| Permission | Why it's needed |
|---|---|
| Read / Write / Edit / Glob / Grep | Core file operations — required for all development work |
| WebFetch / WebSearch | Research while implementing (docs, API references, error lookups) |
| Agent | Spawn sub-agents for parallelised tasks (e.g. build + test in parallel) |
| npm / npx / pnpm / yarn | Install packages, run builds, run tests, run linters |
| node | Run scripts directly |
| git add / commit / status / diff / log / branch / checkout / stash | Full local git workflow — commits managed autonomously |
| git merge --no-ff | Merge feature branches into main locally |
| mkdir / touch / cp / mv | File and directory management |
| curl | Fetch remote resources, test API endpoints during development |

### What You Keep Control Of

| Blocked Operation | Why you keep this |
|---|---|
| `git push` | You approve before any code goes to remote — nothing is published without your sign-off |
| `git reset --hard` | Destructive — could erase your work |
| `git rebase` | Rewrites history — requires your judgement |
| `git tag` | Release tags should be deliberate acts |
| `rm -rf` | Irreversible deletion — always prompt |
| `sudo` | System-level changes — never autonomous |
| `mysql` / `psql` / `drop` | Direct database commands — migrations are used instead; never raw DB access |

### How to Apply This

**Option A — Project-level (recommended):** Place `.claude/settings.json` at the root of this repository. These permissions apply only to this project.

**Option B — Global:** Place the same file at `~/.claude/settings.json` to apply across all your projects. Less safe — use project-level unless you understand the implications.

### When Approval Is Still Required

Even with the `allow` list above, the following always prompt for explicit approval:
- Pushing to a remote branch
- Deleting files with `rm -rf`
- Running direct database commands
- Any `sudo` operation
- Any command not matched by the allow list

If the tooling is blocked mid-sprint on something it should be permitted to do, type `! <command>` in the prompt to run it directly in the session.

### Providing Secrets and API Keys

Do **not** paste API keys into the chat. Instead:

1. Create a `.env.local` file at the project root (already gitignored by Next.js)
2. Add your credentials: `KYC_API_KEY=...`, `SCREENING_API_KEY=...`, etc.
3. Instruct the tooling that credentials have been added to `.env.local` and provide the integration brief
4. The tooling reads key names from `.env.example` (which it maintains) and uses them in code — values are never exposed

### Git Configuration

All commits and pushes to GitHub are made under the Limit Unlimited account. Configure git for this project as follows:

```bash
git config user.name "capg84"
git config user.email "<your Limit Unlimited email>"
```

Run this once from the project root. The development tooling will commit under this identity automatically. All pushes to remote must be approved by you before execution — the tooling prepares the commit and branch; you authorise the push.

### Push Cadence Policy

To keep the remote in sync and protect against local data loss, the following push cadence applies:

- **After every commit** — a post-commit hook will remind you to push
- **End of every session** — always push before closing the project
- **After every sprint deliverable** — push immediately when a sprint item is marked complete
- **Never leave uncommitted work overnight** — commit and push at end of day

The post-commit hook (installed in `.git/hooks/post-commit`) prints a push reminder after every local commit. Run `git push` to action it.

---

## Sprint Calendar

| Sprint | Dates | Theme | Status | Completed |
|---|---|---|---|---|
| Sprint 0 | Apr 7 – Apr 18 ~~→ Apr 6~~ | Foundation & Infrastructure | Completed | 2026-04-06 |
| Sprint 1 | Apr 21 – May 2 ~~→ Apr 6~~ | Authentication & Backoffice Shell | Completed | 2026-04-06 |
| Sprint 2 | Apr 7 – Apr 11 ~~→ Apr 6~~ | Global Settings & User/Role Management | Completed | 2026-04-06 |
| Sprint 3 | Apr 14 – Apr 18 ~~→ Apr 7~~ | Customer Management & Onboarding Ops | Completed | 2026-04-07 |
| Sprint 4 | Apr 22 – Apr 30 | Wallet/Account Management + Web App Onboarding | Upcoming | — |
| Sprint 5 | May 4 – May 13 | Payments Operations + Web App Core Flows | Upcoming | — |
| Sprint 6 | May 18 – May 28 | Compliance, Treasury & Accounting Basics | Upcoming | — |
| Sprint 7 | Jun 1 – Jun 9 | Payment Rail API & Integration Hardening | Upcoming | — |
| Sprint 8 | Jun 12 – Jun 26 | Security Audit, UAT & Go-Live | Upcoming | — |

---

## Sprint Details

---

### Sprint 0 — Foundation & Infrastructure
**Dates:** Apr 7 – Apr 18  
**Status:** Completed — 2026-04-06 *(delivered ahead of schedule)*  
**Goal:** Establish the technical foundation so every engineer can build in parallel from Sprint 1 onward.

#### Deliverables

**Infrastructure**
- [x] Repository structure: monorepo with `/apps/backoffice`, `/apps/web`, `/packages/ui`, `/packages/db`, `/packages/config`
- [x] Next.js projects scaffolded for Backoffice and Web App
- [x] MySQL database provisioned locally (`pangea_pay`)
- [x] Base database schema: tenants, users, sessions, audit_logs — migrated via Drizzle
- [x] CI/CD pipeline (GitHub Actions): lint → build → migration on push to main/develop
- [x] Environment config: `.env.example` with all provider placeholders; `.env.local` gitignored
- [ ] Staging environment — deferred, local-only for development phase

**Design System**
- [x] Tailwind CSS configured with Pangea brand tokens (colours, typography) in `@pangea/config`
- [ ] shadcn/ui initialised in shared package — Sprint 1
- [ ] Base layout components: AppShell, Sidebar, TopNav, PageHeader, DataTable, Modal, Form, Button variants — Sprint 1
- [ ] Lato Bold Italic for headings, Inter for body — Sprint 1

**Commercial Portal (minimal)**
- [ ] Tenant provisioning form — Sprint 1
- [ ] Tenant list view with status indicator — Sprint 1
- [ ] BRS ref: §1.5 Tenant Provisioning and Environment Management

**Third-Party Setup**
- [ ] KYC/identity verification provider — mock adapter in place; real provider TBD
- [ ] Sanctions / screening provider — mock adapter in place; real provider TBD
- [ ] FX / rate source — mock adapter in place; real provider TBD
- [ ] Email provider — Mailpit local SMTP for dev; real provider TBD
- [ ] SMS provider — mock adapter in place; real provider TBD

#### Definition of Done
- All engineers can clone, run locally, and push to staging
- Staging deploy is automated on merge to `main`
- Brand tokens render correctly in dev browser
- Tenant create/list round-trip works end-to-end

#### Risks
- Third-party sandbox access can take 5–10 business days — start immediately
- Infrastructure decisions made here affect every subsequent sprint; do not rush schema decisions

---

### Sprint 1 — Authentication & Backoffice Shell
**Dates:** Apr 21 – May 2  
**Status:** Completed — 2026-04-06 *(delivered ahead of schedule)*  
**Goal:** Backoffice and Web App both have working, secure authentication and a navigable shell ready for feature work.

#### Deliverables

**Authentication (Backoffice)**
- [ ] Login page: email + password with Pangea brand styling
- [ ] TOTP-based MFA enrolment and verification flow
- [ ] Session management: JWT or secure session tokens, configurable timeout
- [ ] Forced password change on first login
- [ ] Failed login lockout policy (configurable attempt threshold)
- [ ] Secure password reset via time-bound email link
- [ ] Remember device option (optional, configurable)
- [ ] BRS ref: §2.2.9 Password and Authentication Management, §2.2.10 Session and Access Control

**Authentication (Web App)**
- [ ] Customer login page with email + password
- [ ] MFA step (TOTP or SMS OTP, configurable per tenant)
- [ ] Registration entry point (shell only — full flow in Sprint 4)
- [ ] Forgot password flow
- [ ] Session timeout and renewal handling
- [ ] BRS ref: §3.11 App Security and Session Management

**Backoffice Shell**
- [ ] Persistent sidebar navigation with all top-level modules (placeholders for unbuilt screens)
- [ ] Top navigation bar: tenant name, user name, avatar, logout
- [ ] Breadcrumb system
- [ ] Role-gated route protection (403 page for unauthorised access)
- [ ] Notification bell (shell only)
- [ ] Responsive layout for 1280px+ screens (Backoffice is desktop-first)
- [ ] BRS ref: §2.1.9 Application Security Settings

**Audit Foundation**
- [ ] Audit log service: captures actor, action, resource, old value, new value, timestamp, tenant
- [ ] All authentication events written to audit log (login, logout, MFA, lockout, password reset)
- [ ] BRS ref: §2.1.14 Audit and Change Traceability, §6.12 Shared Audit and Evidence Rules

#### Definition of Done
- Backoffice and Web App login/logout work with MFA
- Incorrect credentials lock account after configured attempts
- Unauthenticated routes redirect to login
- All auth events appear in audit log with correct fields
- Role-based route guard rejects unauthorised users with 403

#### Risks
- MFA library selection should be agreed in Sprint 0 to avoid rework
- Session architecture (cookie vs JWT) should be locked here — changes later are expensive

---

### Sprint 2 — Global Settings & User/Role Management
**Dates:** May 5 – May 16  
**Goal:** Backoffice administrators can configure the platform and manage internal users with full role-based access control.

#### Deliverables

**Global Settings**
- [ ] Core Setup display: tenant name, base currency, timezone, environment type, platform version, configuration completeness indicator
- [ ] Country configuration: add, update, activate/deactivate, country risk rating, send/receive designation
- [ ] Corridor configuration: activate/deactivate, permitted products, permitted payout methods per corridor
- [ ] Currency configuration: ISO code, decimal precision, activation status, eligibility flags
- [ ] Product and service configuration: product code, name, type, eligible countries, eligible channels, active/inactive
- [ ] Payout method configuration: add, update, activate/deactivate, operational cut-off times, value limits
- [ ] Funding method configuration: bank transfer, wallet funding; eligibility by customer type and country
- [ ] Pricing and fee configuration: corridor-level fees, fixed + percentage fee models, FX spread rules, effective dates
- [ ] Notification template management: email and SMS templates, event-based mapping, merge fields, version history
- [ ] Feature flags: create, activate, deactivate; environment-specific and corridor-specific activation; maintenance mode toggle
- [ ] Business rules and threshold configuration: transaction limits, daily/monthly limits, risk-based review thresholds
- [ ] Reference data: document types, customer types, risk categories, source of funds, transaction purpose categories
- [ ] Audit trail for all settings changes
- [ ] BRS ref: §2.1.1 through §2.1.14

**User & Role Management**
- [ ] Internal user creation: name, email, role, department, tenant, MFA requirement, permitted environments
- [ ] User invitation by email with time-bound activation link
- [ ] User status lifecycle: invited → active → suspended → deactivated → archived
- [ ] Role creation and management: name, permission set, privileged flag, active/inactive
- [ ] Granular permission model: view, create, edit, approve, delete, export per module
- [ ] Role assignment to users: single and multi-role, effective and expiry dates
- [ ] Privileged access controls: mandatory MFA, enhanced audit for privileged users
- [ ] User directory: searchable by name, email, role, department, status, MFA status
- [ ] Account unlock and forced password reset flows
- [ ] User and role audit trail
- [ ] Reporting views: active users, locked/suspended users, MFA compliance, dormant accounts
- [ ] BRS ref: §2.2.1 through §2.2.13

#### Definition of Done
- Admin can create a user, assign a role, and that user's access is gated correctly
- Deactivated users cannot log in
- Pricing config change creates a versioned audit record
- Feature flag can disable a corridor-level product without a code deploy
- All settings changes are visible in the audit trail with before/after values

#### Risks
- Permission model complexity — keep the CRUD model simple; do not over-engineer maker-checker on every action at this stage
- Pricing engine needs to be extensible — spec the data model carefully before coding

---

### Sprint 3 — Customer Management & Onboarding Operations
**Dates:** May 19 – May 30 ~~→ Apr 7~~
**Status:** Completed — 2026-04-07 *(delivered ahead of schedule)*
**Goal:** Operations and compliance teams can view, manage, and action customer records including KYC review workflows.

#### Deliverables

**Customer Profile Management**
- [x] Customer list view: searchable and filterable by name, type, status, risk category, onboarding status
- [x] Individual customer profile: full legal name, DOB, nationality, residence, contact details, address, occupation, source of funds, risk category
- [x] Business customer profile: legal entity name, registration number, incorporation country, business type, sector, source of funds
- [x] Customer status lifecycle: prospect → onboarding → active → suspended → closed → archived
- [x] Customer risk category: low, medium, high; editable by authorised users; audit logged
- [x] Customer segmentation and classification (tenant-configured)
- [x] BRS ref: §2.3.1, §2.3.2

**Customer User Management**
- [x] List of users linked to a business customer
- [x] User permission levels (standard, admin, view_only) per linked user
- [x] Ability to add linked users; status lifecycle (active, suspended, removed)
- [x] BRS ref: §2.3.3

**Onboarding and KYC Operations**
- [x] Onboarding queue: list of applications pending review, filterable by status and type; summary stats strip
- [x] KYC document review screen: view submitted documents, accept or reject with reason
- [x] Onboarding status transitions: pending → under_review → approved → rejected (enforced server-side)
- [x] Manual override: authorised user can approve or reject with documented reason
- [x] Risk assessment entry: manual risk scoring form, scoring history, next review date auto-calculated
- [x] Screening status display: mock adapter active; flag clear, pending, match, review; live provider in Sprint 7
- [x] SAR record creation (basic): internal SAR log entry linked to a customer record
- [x] Document expiry dates stored and displayed per document
- [x] Review cycle reminders: LR 24-month, MR 18-month, HR 6-month auto-calculated on assessment
- [x] BRS ref: §2.16 Onboarding and Verification Operations, §2.10 (SAR creation only)

**Blacklist Management**
- [x] Blacklist flag on customer record: set by authorised user with mandatory reason
- [x] Blacklist history audit logged with actor, timestamp, reason
- [x] BRS ref: §2.3 (blacklist controls)

**Commissions and Partner Deal (basic)**
- [x] Commission record linked to customer: type (fixed/percentage/tiered), rate, effective date
- [x] BRS ref: §2.7 (commission config — basic link only)

**Customer Audit Trail**
- [x] Every profile change, status change, risk category change, screening, SAR, and commission event audit logged
- [x] Audit trail tab visible on the customer profile screen
- [x] BRS ref: §2.3 audit requirements, §6.12

#### Definition of Done ✓
- Operations user can find a customer, review their KYC documents, and approve or reject them
- Approved customer status auto-transitions to active
- Screening runs via mock adapter and displays correctly; live provider deferred to Sprint 7
- Blacklisted customer flag is set with mandatory reason and audit logged
- All profile changes appear in the customer audit trail tab

#### Notes
- UBO / director / shareholder fields for business customers deferred — structured data model for legal entities will be designed in Sprint 4 alongside wallet/account management
- Document file storage (S3 / local) deferred — file metadata is captured; binary upload endpoint to be added when storage provider is configured
- Live screening provider (ComplyAdvantage or equivalent) — sandbox credentials required; mock adapter in production until Sprint 7

---

### Sprint 4 — Wallet/Account Management & Web App Onboarding
**Dates:** Jun 2 – Jun 13  
**Goal:** Backoffice can manage customer wallets and accounts; Web App customers can register, complete onboarding, and view their account.

#### Deliverables

**Backoffice — Wallet and Current Account Management**
- [ ] Wallet/account list per customer: account number, currency, balance, status, open date
- [ ] Account status lifecycle: pending → active → blocked → suspended → closed
- [ ] Open, block, suspend, and close account actions (authorised users only, with reason)
- [ ] Balance view: current balance, available balance, reserved balance
- [ ] Account transaction history: paginated list with date, type, amount, status, reference
- [ ] Manual balance adjustment: create journal entry with reason, requires privileged permission + audit log
- [ ] Multi-currency balance display where applicable
- [ ] Virtual account list linked to a current account (display only at this stage)
- [ ] BRS ref: §2.4 Wallet and Current Account Management

**Backoffice — Beneficiary Management (Operational View)**
- [ ] Beneficiary list per customer: name, account details, currency, status, add date
- [ ] Ability to flag or block a beneficiary from the backoffice
- [ ] BRS ref: §2.6 (read/flag operations only)

**Web App — Customer Registration**
- [ ] Registration form: full legal name, email, mobile, password, country of residence
- [ ] Email verification: OTP or verification link
- [ ] Mobile verification: SMS OTP
- [ ] Terms and conditions acceptance with version tracking
- [ ] BRS ref: §3.1 Customer Registration and Access Initiation

**Web App — KYC Onboarding Flow**
- [ ] Personal details collection: DOB, nationality, address, occupation, source of funds
- [ ] Document upload: national ID or passport, proof of address
- [ ] Submission confirmation screen with estimated review timeline
- [ ] Onboarding status display: under review, approved, rejected with reason
- [ ] BRS ref: §3.2 Identity Verification and Onboarding

**Web App — Wallet and Account Dashboard**
- [ ] Dashboard: display active wallets/accounts with currency and balance
- [ ] Account detail screen: balance breakdown, recent transactions (last 5)
- [ ] Multi-currency balance display
- [ ] BRS ref: §3.3 Wallet and Current Account Access

#### Definition of Done
- Customer registers on Web App, submits KYC documents
- Operations user sees the application in the onboarding queue, reviews, and approves
- Approved customer can log in and see their active account and balance
- Backoffice account block action prevents Web App user from transacting
- All wallet open/close/adjust actions are audit logged

#### Risks
- Document upload requires file storage (S3 or equivalent) — must be provisioned in Sprint 0
- KYC provider webhook for status updates must be working before the end of this sprint

---

### Sprint 5 — Payments Operations & Web App Core Flows
**Dates:** Jun 16 – Jun 27  
**Goal:** End-to-end payment flow works: customers can initiate a transfer on the Web App; operations can view and manage it in the Backoffice.

#### Deliverables

**Backoffice — Payment and Transaction Operations**
- [ ] Transaction list: paginated, filterable by date range, status, type, amount, customer, corridor
- [ ] Transaction detail screen: all fields, status timeline, linked documents, audit trail
- [ ] Transaction status lifecycle: initiated → pending → processing → completed → failed → cancelled → refunded
- [ ] Manual status override: for authorised users, with reason, audit logged
- [ ] Payment hold: place a transaction on hold pending compliance review
- [ ] Payment release: release a held transaction after review clearance
- [ ] Payment cancellation: cancel a pending transaction with reason
- [ ] Refund initiation: create a refund against a completed transaction (manual process)
- [ ] Transaction query creation: link a customer query to a transaction record
- [ ] Payment files: view and download bulk payment files where applicable
- [ ] BRS ref: §2.8 Payment and Transaction Operations

**Web App — Beneficiary Management**
- [ ] Add beneficiary: name, bank account details (IBAN/account number/sort code), currency, country
- [ ] Beneficiary list: display, edit, delete
- [ ] Beneficiary verification confirmation before saving
- [ ] BRS ref: §3.5 Beneficiary and Counterparty Management

**Web App — FX Quote and Conversion**
- [ ] Get quote: enter send amount and currency, select receive currency, display rate, fee, and receive amount
- [ ] Quote validity countdown (configurable, e.g. 30 seconds)
- [ ] Accept quote and confirm conversion
- [ ] Conversion confirmation screen with receipt
- [ ] Conversion history
- [ ] BRS ref: §3.6 FX Quote and Conversion

**Web App — Payment Initiation**
- [ ] Send money flow: select beneficiary → enter amount → select funding method → get quote → review → confirm
- [ ] Transaction confirmation screen with reference number
- [ ] Pre-submission validation: limits check, blocked corridor check, account status check
- [ ] Duplicate transaction warning
- [ ] Transaction pending screen with status tracking
- [ ] BRS ref: §3.7 Payments, Transfers, and Remittance Initiation

**Web App — Transaction History**
- [ ] Transaction list: all transactions with date, type, amount, status, reference
- [ ] Transaction detail: full breakdown, status timeline, reference number, receipt download
- [ ] BRS ref: §3.8 Transaction and Account Activity Tracking

#### Definition of Done
- Customer on Web App can initiate a payment end-to-end in the sandbox
- Transaction appears in the Backoffice transaction list immediately
- Operations user can place the transaction on hold; customer sees "under review" status
- Operations user can release the transaction; customer sees updated status
- FX quote refreshes after expiry and customer cannot submit a stale quote
- All payment events are audit logged

#### Risks
- Payment routing to banking/payout partner sandbox must be operational by start of this sprint
- FX rate feed must be live; stale or missing rates must fail gracefully
- Limits enforcement requires the business rules config from Sprint 2 to be correctly populated

---

### Sprint 6 — Compliance, Treasury & Accounting Basics
**Dates:** Jun 30 – Jul 11  
**Goal:** Core compliance screening, treasury visibility, and ledger posting are operational in the Backoffice.

#### Deliverables

**Backoffice — AML/CTF and Compliance Operations (Core)**
- [ ] Alert queue: list of compliance alerts with type, severity, customer reference, date, status
- [ ] Alert detail: full alert information, linked transaction or customer, action history
- [ ] Alert status workflow: open → under review → cleared → escalated → closed
- [ ] Case creation: create a compliance case linked to one or more alerts or customers
- [ ] Case detail screen: timeline, linked events, notes, documents, assigned user
- [ ] Case status workflow: open → under investigation → closed → escalated to SAR
- [ ] Sanctions and PEP screening: display screening results per customer and per transaction (from provider)
- [ ] SAR record management: internal SAR log, draft, submitted, filed statuses
- [ ] Transaction monitoring thresholds: view and reference configured thresholds (set in Global Settings)
- [ ] BRS ref: §2.10 AML/CTF/Fraud and Case Management (core alert and case flows only)

**Backoffice — Treasury and Nostro Management (Core)**
- [ ] Nostro account registry: list of nostro accounts with bank, currency, balance, status
- [ ] Nostro statement view: transaction-level statement per nostro account
- [ ] Safeguarding status: total safeguarded balance display vs total customer liability
- [ ] Prefunding record: view prefunding positions per partner/route
- [ ] BRS ref: §2.9 Treasury, Safeguarding, and Nostro Management (core views only)

**Backoffice — Accounting and Ledger (Core)**
- [ ] Chart of accounts: configurable account list with code, name, type (asset/liability/income/expense)
- [ ] Automatic journal posting: every transaction event creates a double-entry journal record
- [ ] Journal entry viewer: filterable by date, account, type, reference
- [ ] Manual journal entry: privileged users can post adjustment entries with reason and approval
- [ ] Basic balance sheet view: asset and liability totals by account
- [ ] BRS ref: §2.12 Accounting and Ledger Management (core posting and viewing only)

**Web App — Statements and Documents**
- [ ] Account statement: downloadable PDF or CSV for a selected date range
- [ ] Document centre: view documents submitted during onboarding; upload additional documents if requested
- [ ] BRS ref: §3.9 Statements, Documents, and Communication

**Notifications (Live)**
- [ ] Email notifications triggered on: registration, KYC status change, payment submitted, payment completed, payment failed, password reset
- [ ] SMS notification on: OTP, payment completed
- [ ] Notification template renders correctly with customer data merged
- [ ] BRS ref: §2.1.8 Notification Template Settings

#### Definition of Done
- Compliance alert appears automatically when a screening match is returned from the provider
- Ops user can create a case, link it to an alert, add notes, and change status
- Every completed payment creates a balanced double-entry journal entry
- Nostro account balance is visible and reconcilable against the statement
- Customer receives email when their payment completes

#### Risks
- Accounting engine correctness is critical — prioritise automated tests for journal posting logic
- Screening provider webhook latency may affect alert timing — design for async
- SAR workflow is sensitive; do not ship submission to external regulators in MVP — keep it as an internal record only

---

### Sprint 7 — Payment Rail API & Integration Hardening
**Dates:** Jul 14 – Jul 25  
**Goal:** Pangea Payment Rail is operational for authorised API consumers; all third-party integrations are hardened for production.

#### Deliverables

**Pangea Payment Rail — Core API**
- [ ] API authentication: OAuth 2.0 client credentials flow; access token issuance and validation
- [ ] API consumer management (backoffice): create, activate, suspend API consumers; credential management
- [ ] Customer API endpoints: customer lookup, customer status, onboarding status
- [ ] Beneficiary API endpoints: add beneficiary, list beneficiaries, get beneficiary
- [ ] Quote API: request quote (amount, send currency, receive currency, corridor); returns rate, fee, receive amount, expiry
- [ ] Payment submission: submit payment with beneficiary, amount, quote reference, funding method
- [ ] Payment status: get payment status by reference; returns current status and timeline
- [ ] Webhook delivery: payment status change events pushed to registered consumer endpoints; retry on failure; signature verification
- [ ] API error handling: standardised error codes, messages, and HTTP status codes
- [ ] Idempotency: idempotency key support on payment submission
- [ ] Rate limiting: per-consumer request rate limits
- [ ] API documentation: OpenAPI 3.x spec published; sandbox environment documented
- [ ] BRS ref: §5.1–§5.10, §5.12–§5.14

**Integration Hardening**
- [ ] KYC provider: production credentials configured, error handling validated, webhook retry logic confirmed
- [ ] Screening provider: production credentials configured, alert generation tested end-to-end
- [ ] Banking/payout partner: production or near-production connectivity confirmed; payment submission and status polling tested
- [ ] FX rate feed: failover behaviour if rate feed is unavailable — reject quote or use cached rate with expiry
- [ ] Email provider: production credentials, delivery rate tested, bounce handling confirmed
- [ ] SMS provider: production credentials, delivery confirmed
- [ ] Secrets management: all credentials in secure vault, not in environment files

**Backoffice — Integration Management**
- [ ] Integration registry screen: list of configured integrations with status, environment, provider, last health check
- [ ] Health check dashboard: live status of each connected provider
- [ ] BRS ref: §2.13 Integration Management (registry and status display only)

**Settlement and Reconciliation (Basic)**
- [ ] Reconciliation upload: upload a bank statement or partner file and match against internal transaction records
- [ ] Unmatched item list: display transactions that do not match the uploaded file
- [ ] Manual match: allow authorised user to manually match an unmatched item
- [ ] BRS ref: §2.15 Settlement and Reconciliation Management (manual reconciliation only)

#### Definition of Done
- An API consumer can authenticate, request a quote, submit a payment, and receive a webhook when the status changes
- Rate limiting blocks consumers exceeding their configured request threshold
- All production integration credentials are in the vault — no plaintext in config files
- Integration registry shows live health status
- Reconciliation upload processes a file and highlights unmatched items

#### Risks
- Payout partner production connectivity may require additional commercial agreements — confirm status urgently
- Webhook delivery reliability must be tested with intentional failure scenarios before go-live
- OpenAPI spec should be auto-generated from code where possible to avoid drift

---

### Sprint 8 — Security Audit, UAT & Go-Live
**Dates:** Jul 28 – Aug 7  
**Goal:** Platform is hardened, tested, and deployed to production. All critical issues resolved. Go-live checklist signed off.

#### Deliverables

**Security**
- [ ] Penetration test or security review completed (external or internal red team)
- [ ] OWASP Top 10 review: SQL injection, XSS, CSRF, broken auth, sensitive data exposure, insecure direct object reference
- [ ] All high and critical findings from security review resolved
- [ ] Content Security Policy (CSP) headers configured on all applications
- [ ] HTTPS enforced everywhere; HTTP redirects to HTTPS
- [ ] Rate limiting on all public endpoints (login, registration, API)
- [ ] Secrets rotation: confirm all credentials can be rotated without downtime
- [ ] Session invalidation on logout confirmed
- [ ] BRS ref: §10.2 Security Requirements

**Performance and Load Testing**
- [ ] Load test against NFR targets: Backoffice and Web App page load under 2 seconds at expected concurrent users
- [ ] API response time: payment submission p95 under 500ms
- [ ] Database query analysis: no unindexed queries on hot paths
- [ ] BRS ref: §10.4 Performance Requirements

**UAT (User Acceptance Testing)**
- [ ] UAT environment provisioned with production-equivalent data (anonymised)
- [ ] UAT test cases executed against all Sprint 1–7 deliverables
- [ ] Critical path flows signed off by product lead: register → onboard → fund → pay → view history
- [ ] Backoffice flows signed off: user management, customer management, payment ops, compliance alert, reconciliation
- [ ] Payment Rail API flows signed off: authenticate → quote → pay → webhook received

**Disaster Recovery**
- [ ] Database backup and restore tested: full restore completed and verified
- [ ] Recovery time objective (RTO) and recovery point objective (RPO) documented and validated
- [ ] Runbook written and reviewed: database recovery, application restart, provider failover
- [ ] BRS ref: §8.3 Recovery Objectives, §8.5 Backup, Restore, and Recovery Controls

**Go-Live Checklist**
- [ ] Production environment provisioned and hardened
- [ ] DNS, SSL certificates, and domain configuration complete
- [ ] Monitoring and alerting live: error rate, latency, failed payments, screening failures
- [ ] On-call runbook distributed to responsible team members
- [ ] Rollback plan documented and tested
- [ ] First tenant provisioned in the Commercial Portal
- [ ] Go-live sign-off obtained from product lead and relevant stakeholders

#### Definition of Done
- No unresolved high or critical security findings
- UAT sign-off received
- Production environment is live, monitored, and staffed for day-one operations
- Rollback procedure is tested and under 30 minutes to execute

---

## Deferred to Phase 2 (Post-MVP)

| Feature | Target Sprint | Notes |
|---|---|---|
| Pangea Mobile App (iOS & Android) | Sprint 9–14 (Nov 2026) | Mirrors Web App flows in React Native |
| Full AML case management | Sprint 10 | Advanced investigation tools, bulk case actions |
| Virtual Account Management | Sprint 10 | §2.5, §3.4 — defer until wallet is proven |
| Full Accounting Module | Sprint 11 | Balance sheet automation, P&L, book entry |
| Reporting Suite | Sprint 10 | Export first; dashboards after |
| Settlement Automation | Sprint 11 | Auto-matching, partner reconciliation files |
| White-Label / Branding Config | Sprint 12 | §1.9 — required for second tenant onwards |
| Support and Entitlement Management | Sprint 12 | §1.10 |
| Full Commercial Management Portal | Sprint 12 | §1.1–§1.12 complete |
| Open Banking Funding | Sprint 13 | Requires provider contract |
| Cash Pickup Payout | Sprint 13 | Requires partner integration |
| Data Subject Rights / GDPR Tooling | Sprint 11 | §7.11 |

---

## Risk Register

*Updated 2026-04-06 to reflect revised timeline and confirmed team composition.*

| # | Risk | Likelihood | Impact | Status | Mitigation |
|---|---|---|---|---|---|
| R1 | **Third-party provider onboarding delayed** — screening, FX, KYC, and payout partner all require account sign-up, compliance review, and sandbox issuance outside our control | **Critical** | **Critical** | Open — no providers selected | Select and engage all providers this week. Development continues against mocks but live sandbox testing is blocked until credentials land. Each week of delay here is a week of go-live delay. |
| R2 | Payout partner not production-ready by Sprint 5 (target May 13) | High | High | Open | Identify primary and backup payout partner. Build payment routing as an abstracted adapter from day one so swapping providers requires no application changes. |
| R3 | Security audit findings require major rework | Medium | High | Open | Run internal OWASP checklist at Sprint 6 end (target May 28) before external review. Address findings in Sprint 8 buffer. |
| R4 | Regulatory or legal review required before go-live | Medium | High | Open | Engage legal/compliance review from Sprint 4 (target Apr 22) onwards. Do not leave this to Sprint 8 — regulatory feedback loops take time. |
| R5 | Sprint 5 or Sprint 6 business logic requires significant iteration | Medium | Medium | Open | These sprints contain the most complex domain logic (double-entry ledger, payment routing, AML). Allow 1–2 extra days of buffer in the revised schedule. |
| R6 | FX rate feed unavailable or too expensive at required update frequency | Low | Medium | Open | Design rate source as a pluggable adapter. Mock rates continue to work for all dev and most testing. |
| R7 | Database schema requires breaking changes in Sprints 4–6 | Medium | Medium | Open | All schema changes go through Drizzle migrations. No manual ALTER TABLE. Review schema at start of each sprint before writing code. |
| R8 | Scope creep — new requirements added mid-sprint | High | Medium | Open | All new requirements go to a backlog and are reviewed only between sprints. Nothing enters an in-progress sprint. |
| R9 | ~~Team size below minimum~~ — resolved | N/A | N/A | Closed | Development tooling replaces the engineering headcount requirement. Team model confirmed. |

---

## Key Milestones

*Revised 2026-04-06. Original dates shown in strikethrough where superseded.*

| Original Date | Revised Date | Milestone | Status |
|---|---|---|---|
| Apr 18 | ~~Apr 18~~ **2026-04-06** | Infrastructure live; design system; CI pipeline | Done |
| May 2 | ~~May 2~~ **2026-04-06** | Authentication and Backoffice shell production-ready | Done |
| May 16 | **Apr 11** | Global settings and user/role management complete | Upcoming |
| May 30 | **Apr 18** | Customer and onboarding operations complete | Upcoming |
| Jun 13 | **Apr 30** | First end-to-end account visible in Web App | Upcoming |
| Jun 27 | **May 13** | First end-to-end payment processed in sandbox | Upcoming |
| Jul 11 | **May 28** | Compliance, treasury, and accounting baseline operational | Upcoming |
| Jul 25 | **Jun 9** | Payment Rail API live; all integrations production-hardened | Upcoming |
| Aug 7 | **Jun 26** | Go-live: production environment live, first tenant operational | Upcoming |

---

## BRS Coverage Map

| BRS Section | Sprint | Status |
|---|---|---|
| §1.5 Tenant Provisioning | Sprint 0 | MVP |
| §2.1 Global Settings | Sprint 2 | MVP |
| §2.2 User and Role Management | Sprint 2 | MVP |
| §2.3 Customer Management | Sprint 3 | MVP |
| §2.4 Wallet/Account Management | Sprint 4 | MVP |
| §2.5 Virtual Account Management | — | Deferred |
| §2.6 Beneficiary Management | Sprint 5 | Partial (ops view only) |
| §2.7 FX and Pricing Management | Sprint 2+5 | Core only |
| §2.8 Payment Operations | Sprint 5 | MVP |
| §2.9 Treasury and Nostro | Sprint 6 | Core views only |
| §2.10 AML/CTF Case Management | Sprint 6 | Core only |
| §2.11 Document Management | Sprint 3+6 | MVP |
| §2.12 Accounting and Ledger | Sprint 6 | Core posting only |
| §2.13 Integration Management | Sprint 7 | Registry and health |
| §2.14 Reports and Audit | — | Deferred |
| §2.15 Settlement and Reconciliation | Sprint 7 | Manual only |
| §2.16 Onboarding Operations | Sprint 3 | MVP |
| §2.17 Customer Support and Query | Sprint 5 | Basic query link |
| §3.1 Web App Registration | Sprint 4 | MVP |
| §3.2 Web App Onboarding | Sprint 4 | MVP |
| §3.3 Web App Wallet/Account | Sprint 4 | MVP |
| §3.4 Web App Virtual Accounts | — | Deferred |
| §3.5 Web App Beneficiary Management | Sprint 5 | MVP |
| §3.6 Web App FX Quote | Sprint 5 | MVP |
| §3.7 Web App Payment Initiation | Sprint 5 | MVP |
| §3.8 Web App Transaction History | Sprint 5 | MVP |
| §3.9 Web App Statements | Sprint 6 | MVP |
| §3.10 Web App Profile Management | Sprint 5 | Basic |
| §3.11 Web App Security | Sprint 1+8 | MVP |
| §4.x Mobile App | — | Deferred (Phase 2) |
| §5.1–§5.14 Payment Rail | Sprint 7 | Core endpoints |
| §6.x Core Business Rules | Sprint 2+5 | Enforced in logic |
| §7.x Data Privacy | Sprint 8 | Basic compliance |
| §8.x Disaster Recovery | Sprint 8 | Runbook + tested restore |
| §10.x Non-Functional Requirements | Sprint 8 | Performance + security |
