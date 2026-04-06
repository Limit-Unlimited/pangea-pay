# Business Requirements for Pangea Pay
_**Version 2.0**_

## Introduction
Pangea Pay is a proprietary software suite, designed and developed by Limit Unlimited Technologies Ltd ("Limit Unlimited").

The suite is intended to operate as a modular cross-border payments platform that supports remittance, wallet, multi-currency account, virtual account, FX, payment processing, compliance, treasury, accounting, and reporting capabilities through a unified product architecture.

This **_REQUIREMENTS.md_** file sets out the business requirements for the Pangea Pay application suite, including product scope, delivery model, functional requirements, non-functional requirements, solution architecture, and recommended technology stack.

Pangea Pay is being designed not only as an in-house operational platform, but also as a commercially deployable product that can be offered to third-party regulated financial institutions under one or more commercial delivery models, including:

- Software as a Service (SaaS)
- Licensed deployment
- Outright sale / source-controlled deployment, where commercially agreed

The platform is intended to support:

- secure digital onboarding of retail and business customers
- wallet and multi-currency virtual account services
- domestic and international payment journeys
- remittance and payout journeys
- compliance and risk management
- treasury, safeguarding, settlement, and reconciliation
- configurable integrations with banking, payment, compliance, and messaging providers
- commercial administration of customer subscriptions, licences, environments, and support entitlements

The preferred operational database is **MySQL**.

## Glossary and Key Definitions

For the purpose of this document, the following terms shall have the meanings set out below.

| Term | Definition |
|---|---|
| Pangea Pay | The overall software suite described in this document. |
| Pangea Suite Customer | An institutional customer that consumes Pangea Pay under SaaS, hosted, licensed, or other agreed commercial models. |
| End Customer | A retail or business customer of a regulated institution using Pangea Pay. |
| Business Customer | A non-individual customer, such as a company or other legal entity, using services provided through Pangea Pay. |
| Customer User | A user account linked to a business customer and authorised to access the platform on behalf of that business customer. |
| Backoffice | The internal operational application used by operations, compliance, treasury, finance, support, and administration users. |
| Web App | The customer-facing web application for end users. |
| Mobile App | The customer-facing mobile application for iOS and Android end users. |
| Payment Rail | The public API layer used by approved aggregator clients, institutional partners, and authorised third parties. |
| Wallet | A customer-held balance facility maintained within the platform, which may support one or more currencies depending on product design. |
| Current Account | A customer account used to hold and manage funds, which may be single-currency or multi-currency depending on product design. |
| Multi-Currency Account | A wallet or account structure that supports balances in more than one currency under a controlled product model. |
| Virtual Account | A virtual account identifier or account arrangement used for inbound payment routing, funding, collection, or customer identification purposes. |
| Beneficiary | A recipient or payee to whom funds may be transferred or paid out. |
| Counterparty | A recipient, sender-side linked party, or other transacting party relevant to a payment, transfer, funding, or account operation. |
| FX Quote | A quoted exchange rate and fee outcome offered for a specific transaction or conversion request, valid for a defined period. |
| FX Conversion | A conversion of funds from one currency to another within a supported account, wallet, or transaction flow. |
| Remittance Transaction | A money transfer transaction intended for payout to a beneficiary in a supported destination corridor. |
| Domestic Payment | A payment made within the same country or local payment system context. |
| International Payment | A payment made across borders or across different currency or settlement systems. |
| Tenant | A logically separated institutional operating context within the platform. |
| Corridor | A supported send-country and receive-country combination, including associated currencies, payout methods, and restrictions. |
| Payout Method | The method by which funds are delivered to the recipient, such as bank transfer, wallet transfer, or cash pickup where enabled. |
| Funding Method | The method by which a customer funds an account, wallet, or transaction, such as bank transfer, balance funding, or open banking where enabled. |
| Safeguarding | The operational and financial control process used to protect relevant customer funds in accordance with applicable regulatory requirements. |
| Nostro Account | A bank or settlement account used by the regulated institution for treasury, settlement, or payout operations. |
| Prefunding | Funds placed in advance with a partner, provider, or route to support payment or payout execution. |
| Ledger | The internal financial recordkeeping framework used to record financial events and balances. |
| Journal Entry | A financial posting record representing the debit and credit treatment of a business event. |
| Settlement | The process of financially settling obligations between Pangea Pay users, partners, providers, and related operational accounts. |
| Reconciliation | The process of matching internal records against bank, partner, treasury, ledger, or other operational records in order to identify and resolve discrepancies. |
| Alert | A compliance, fraud, risk, operational, or monitoring signal requiring review. |
| Case | A controlled investigation record created for compliance, fraud, operational, or related review purposes. |
| SAR / STR | Suspicious Activity Report / Suspicious Transaction Report, whether internal or external, depending on jurisdiction and process design. |
| Maker-Checker | A control model requiring one authorised user to prepare an action and another authorised user to approve it before completion. |
| White-Label | A deployment or product presentation model in which branding and selected customer-facing settings are customised for a specific institutional customer. |

## Product Positioning
Pangea Pay shall be positioned as a modular payments technology suite for regulated financial institutions that need one or more of the following capabilities:

- remittance processing
- wallet and stored-value account management
- multi-currency virtual account services
- cross-border payment orchestration
- payout partner integration
- customer onboarding and KYC operations
- compliance and transaction monitoring
- ledgering, accounting, and reconciliation
- white-label or tenant-specific deployment
- API-based partner distribution

Remittance shall be treated as one supported business capability of the suite, not the sole product definition.

## Use Case
Pangea Pay will be used by businesses that run or intend to run regulated payment, wallet, remittance, or cross-border financial service operations.

Target customer types include, but are not limited to:

- Payment Institutions
- Electronic Money Institutions
- Remittance Service Providers
- Money Service Businesses
- Payment Processors
- FX and cross-border payment providers
- Wallet providers
- FinTech businesses operating regulated payment products
- Any other regulated financial institutions offering payment, remittance, account, wallet, or related financial services

These businesses may consume Pangea Pay under one or more commercial models, including:

- multi-tenant SaaS
- single-tenant hosted deployment
- licensed deployment into customer-managed infrastructure
- outright commercial transfer or sale, subject to separate contractual agreement

## Regulatory Positioning Note

This Business Requirements Specification is intended to define the business, operational, control, and technology requirements of the Pangea Pay platform at a platform level.

Unless explicitly stated otherwise, this document is not intended to serve as a jurisdiction-specific legal or regulatory policy document in its own right.

Specific jurisdictional obligations, regulatory interpretations, reporting processes, and compliance operating procedures applicable to a regulated institution using Pangea Pay shall be addressed through:

- jurisdiction-specific compliance policies
- operational procedures
- control frameworks
- legal and regulatory advice
- implementation-specific configuration and governance decisions

These may include, depending on the operating jurisdiction, requirements arising from regulators, competent authorities, financial-crime frameworks, data-protection law, and internal governance standards.

## Business Objective
The objective of Pangea Pay is to deliver a secure, scalable, compliant, configurable, and commercially deployable payments platform that:

- enables retail and business customers to hold, manage, convert, send, and receive funds through web, mobile, and API channels
- supports wallet, multi-currency account, and virtual account product models
- supports domestic and international transfers, remittance flows, and partner-mediated payout services
- provides a centralised backoffice platform for operations, compliance, treasury, accounting, customer servicing, and reporting
- enables regulated institutions to operate under their own commercial and regulatory models using configurable controls, products, pricing, and integrations
- supports multi-tenant delivery and customer-specific deployment models for Pangea Suite customers
- provides commercial controls for subscription, licensing, billing, environment access, support entitlements, and service configuration
- maintains robust financial controls through ledgering, safeguarding, settlement, reconciliation, and auditability
- supports future expansion through modular architecture, configurable integrations, and controlled feature rollout

## Commercial Delivery Objective
In addition to the end-customer and operational capabilities of the platform, Pangea Pay shall support the commercial delivery and lifecycle management of the suite itself as a product offered by Limit Unlimited to institutional customers.

The suite shall therefore support a commercial management layer through which Limit Unlimited can manage:

- customer organisations using Pangea Pay
- tenancy or deployment model per customer
- contracted products and modules
- subscription plans
- licence terms
- billing configuration
- environment allocation
- domain / branding configuration where applicable
- support entitlements and service levels
- feature entitlements
- contract start, renewal, suspension, and termination events

## In Scope
The Pangea Pay suite shall include:

- institutional customer onboarding for Pangea Suite customers
- commercial and subscription management for Pangea Suite customers
- tenant and environment provisioning
- end-user registration and authentication
- retail and business customer profile management
- customer user and access-right management
- KYC / KYB onboarding and verification workflows
- wallet and current account management
- multi-currency balance management
- virtual account management
- beneficiary and counterparty management
- quote generation and FX pricing
- currency conversion
- domestic and international payment initiation
- remittance transaction creation and lifecycle management
- transaction tracking and history
- AML / CTF screening, case management, and monitoring
- fraud and risk controls where configured
- treasury management
- safeguarding and client money oversight
- payment orchestration
- partner integrations
- settlement and reconciliation
- internal ledger and accounting support
- notification and communication services
- transaction query and exception management
- reporting and audit trail management
- backoffice user management
- global configuration and feature control management
- public API access for aggregator and partner clients
- white-label and customer-specific configuration, where commercially agreed

## Out of Scope
The following are outside the scope of this phase unless explicitly added later:

- consumer card issuing
- consumer lending or credit products
- cryptocurrency-based transfers or wallets
- investment and wealth management products
- merchant acquiring and POS acceptance
- physical branch teller system
- payroll processing
- tax filing services
- insurance distribution
- loyalty and rewards schemes
- marketplace escrow products
- unsupported regulated activities not specifically defined in the functional scope

## Product Delivery Models
Pangea Pay shall support the following commercial delivery models.

For the avoidance of doubt, regardless of the commercial delivery model selected, each Pangea Suite customer shall operate within a dedicated technical environment with dedicated data storage and database isolation, unless an explicitly approved exception is documented in the contract, architecture, and risk governance records.

### 1. Multi-Customer SaaS with Dedicated Client Environments
Limit Unlimited hosts and manages the platform as a SaaS offering for multiple Pangea Suite customers. However, each institutional customer shall be provisioned with a dedicated application environment and dedicated database, with customer-specific configuration, controlled access, and logical and infrastructure-level isolation appropriate to a regulated financial-services platform.

### 2. Single-Tenant Hosted Deployment
A dedicated hosted environment shall be provisioned for an individual Pangea Suite customer, with customer-specific configuration, integrations, infrastructure isolation, and dedicated database resources as contractually required.

### 3. Licensed Deployment
The software shall be licensed to a customer for deployment within customer-controlled or customer-designated infrastructure, subject to agreed licence, security, support, and upgrade terms. Under this model, the customer shall operate its own dedicated environment and dedicated database resources.

### 4. Outright Commercial Transfer / Sale
The platform or an agreed subset of the platform may be sold or transferred under a separate contractual arrangement. The commercial management requirements in this document may still apply during pre-handover, transition, and post-sale support periods where agreed. Under this model, the customer or acquiring entity shall operate dedicated infrastructure and dedicated database resources unless otherwise explicitly agreed.

## Applications in Scope
The Pangea Suite shall include the following applications and platform layers.

| Application / Layer | Description |
|-------------|-------------|
| 1. Pangea Backoffice | A secure web application serving as the core operational platform for the suite. It shall support customer servicing, compliance, treasury, payments, wallet and account operations, accounting, reporting, configuration, and audit activities. |
| 2. Pangea Web App | A secure web application for end users to register, complete onboarding, manage wallets and accounts, view balances, manage beneficiaries, perform FX conversions, create payments or remittance transactions, and track activity. |
| 3. Pangea Mobile App | Native or cross-platform mobile applications for iOS and Android that provide the same core customer journeys as the web application, including onboarding, wallet/account management, transfers, tracking, and security controls. |
| 4. Pangea Payment Rail | A public API layer for aggregator clients, institutional partners, and other approved API consumers to connect to Pangea Pay’s payment, account, transfer, status, and related services. This scope includes modern HTML API documentation with sample requests and responses. |
| 5. Pangea Commercial Management Portal | A secure administrative application or controlled application layer for Limit Unlimited to manage Pangea Suite customers, subscriptions, licences, modules, environments, billing setup, entitlements, deployment model, and contractual service controls. |

## Stakeholders

| Stakeholder Group | Interest / Responsibility |
|---|---|
| Executive Leadership | Strategic direction, funding, commercial model, governance |
| Product Team | Requirements, roadmap, feature prioritisation, packaging |
| Operations Team | Transaction operations, account servicing, exception handling |
| Compliance / AML Team | Screening, monitoring, investigations, controls |
| Treasury / Finance Team | Liquidity, safeguarding, settlement, reconciliation, finance reporting |
| Technology Team | Architecture, development, infrastructure, security, release management |
| Customer Support Team | End-user support, communication, query resolution |
| Commercial / Sales Team | Pangea Suite customer acquisition, product packaging, commercials |
| Customer Success / Account Management Team | Tenant onboarding, configuration coordination, support oversight |
| Billing / Commercial Operations Team | Subscription setup, billing controls, renewals, licence records |
| Banking / Payment Partners | Funding, settlement, payout, payment processing, account services |
| End Users | Registration, onboarding, wallet/account use, payments, tracking |
| Business Customers | Multi-user account access, wallet/account operations, payments |
| Aggregator Clients / API Consumers | Authentication, payments, status, account integration |
| Pangea Suite Customers | Institutional clients consuming Pangea Pay under SaaS, licensed, or outright models |

## Assumptions, Dependencies, and Constraints

The requirements in this document are based on the following assumptions, dependencies, and constraints.

### Assumptions

The platform is being designed on the assumption that:

- Pangea Pay will be used by regulated financial institutions or by institutions operating under a regulated payments or financial-services model
- product, corridor, currency, account, and integration availability will be controlled through configuration and entitlement
- Web App, Mobile App, and Payment Rail will rely on shared business rules and common service logic wherever practical
- wallet, multi-currency account, and virtual account capabilities may be enabled or disabled per tenant, product, or deployment model
- different institutional customers may operate different products, countries, corridors, and compliance configurations within the same broader platform architecture
- some integrations may operate in real time, while others may be file-based, delayed, or partially asynchronous
- certain controls, disclosures, or workflows may vary by jurisdiction, regulated entity type, or contractual arrangement

### Dependencies

The platform requirements depend on the availability or suitability of:

- banking partners
- payout partners
- FX and rate sources
- KYC / identity-verification providers
- sanctions, PEP, and screening providers
- messaging providers for email, SMS, and push notifications
- hosting and infrastructure services
- secure credential and secret-management services
- regulatory, legal, and compliance policy input from the operating institution
- finance, safeguarding, and reconciliation operating models defined by the regulated institution
- customer-specific commercial agreements where Pangea Pay is provided to third-party institutional customers

### Constraints

The platform shall be designed with the following constraints in mind:

- the preferred operational database is MySQL
- regulated financial-service controls, auditability, and recordkeeping obligations shall take priority over convenience or speed of implementation
- product behaviour must remain configurable across tenants and deployment models without excessive code-level customisation
- customer-facing channels must provide consistent business outcomes even where their presentation differs
- financial postings and material audit records must remain traceable and protected from uncontrolled deletion or overwrite
- data privacy, retention, and regulatory obligations may constrain what data can be deleted, changed, exported, or displayed
- operational resilience and continuity requirements may require controlled degraded modes and temporary feature restrictions

## Core Domain Model
The suite shall support the following core business entities:

- Pangea Suite customer
- tenant
- deployment environment
- subscription / licence agreement
- product module entitlement
- end customer
- business customer
- customer user
- wallet / current account
- multi-currency balance
- virtual account
- beneficiary / counterparty
- FX quote
- FX conversion
- payment / transfer / remittance transaction
- ledger entry / journal
- compliance alert / case
- document
- notification
- integration endpoint
- payout partner
- banking relationship
- settlement position
- reconciliation item

## Functional Requirements

## 1. Pangea Commercial Management Portal
The Pangea Commercial Management Portal shall enable Limit Unlimited to manage the commercial lifecycle of institutional customers who use the Pangea Pay suite.

### 1.1 Institutional Customer Management
The system shall allow authorised users to:

- create and maintain institutional customer records
- classify each institutional customer by customer type, jurisdiction, regulatory status, and commercial segment
- record legal entity details, trading name, registered address, billing address, and key contacts
- record implementation owner, account manager, and support owner
- maintain commercial status such as prospect, onboarding, active, suspended, terminated, and archived
- store contract references and key commercial notes
- link uploaded commercial and contractual documents to the institutional customer record

### 1.2 Delivery Model Management
The system shall allow authorised users to configure the delivery model for each institutional customer, including:

- multi-tenant SaaS
- single-tenant hosted deployment
- licensed deployment
- outright sale / transition arrangement

For each customer, the system shall record:

- deployment model
- hosting responsibility
- infrastructure responsibility
- upgrade responsibility
- support model
- environment model
- customer-specific restrictions or obligations

### 1.3 Subscription and Licence Management
The system shall allow authorised users to create and maintain subscription or licence records for each institutional customer.

Each subscription or licence record shall include:

- agreement type
- agreement reference
- effective date
- renewal date
- termination date where applicable
- notice period
- billing frequency
- contracted user volumes where applicable
- contracted transaction volumes where applicable
- contracted environments
- contracted modules
- commercial status
- suspension status
- reason for suspension or termination where applicable

The system shall support more than one active commercial agreement per institutional customer where the business model requires separate agreements for modules, regions, or entities.

### 1.4 Product and Module Entitlement Management
The system shall allow authorised users to assign product modules and entitlements to each institutional customer.

The entitlement model shall support, at minimum:

- Backoffice
- Web App
- Mobile App
- Payment Rail API
- wallet module
- virtual account module
- remittance module
- FX module
- accounting / ledger module
- compliance module
- reconciliation module
- white-label module
- reporting module

For each entitlement, the system shall allow configuration of:

- activation status
- effective date
- expiry date where applicable
- environment availability
- feature restrictions
- volume or usage limits
- country / corridor restrictions
- branding eligibility where applicable

### 1.5 Tenant Provisioning and Environment Management
The system shall support provisioning and lifecycle management of customer tenants and dedicated customer environments.

It shall allow authorised users to:

- create a tenant for an institutional customer
- allocate tenant identifier and dedicated environment reference
- assign dedicated production and non-production environments
- configure environment status
- suspend or archive environments
- record deployment region and infrastructure notes
- record environment URLs and access endpoints
- record implementation status and go-live date
- link environment records to contracted modules and feature entitlements
- link each customer environment to its dedicated database and storage context

### 1.6 Billing Configuration Management
The system shall support billing setup for each institutional customer.

The billing configuration shall allow storage and maintenance of:

- billing entity
- invoice recipient
- billing address
- payment terms
- billing currency
- tax treatment
- subscription fee model
- implementation fee model
- support fee model
- usage-based fee model
- overage charging rules
- discount or promotional treatment
- custom commercial arrangements

This section is intended to manage billing configuration and commercial control data. Detailed finance system invoicing may be integrated externally where required.

### 1.7 Usage and Consumption Tracking
The system shall support measurement and reporting of customer usage for commercial and operational purposes.

Usage measures may include, but shall not be limited to:

- active users
- active customer records
- number of accounts or wallets
- number of virtual accounts
- API calls
- transactions processed
- total processing value
- storage consumption
- enabled modules
- support requests against plan entitlement

The system shall maintain historical usage records for billing validation, account reviews, and contractual dispute support.

### 1.8 Commercial Status and Service Controls
The system shall allow authorised users to apply commercial service controls where contractually or operationally required.

These controls may include:

- suspension of non-production access
- suspension of production access subject to governance control
- API disablement
- module disablement
- feature restriction
- usage cap enforcement
- read-only mode
- billing hold flags
- contract expiry warnings
- renewal pending status

Critical service controls in production shall support maker-checker approval where configured.

### 1.9 White-Label and Branding Management
Where the commercial model includes white-label or customer-specific branding, the system shall allow authorised users to configure:

- customer display name
- app name override where applicable
- logo assets
- colour themes
- email branding assets
- domain or subdomain mappings
- legal footer content
- customer support contact details
- environment-specific branding rules

Branding changes shall be subject to validation, preview, and audit logging.

### 1.10 Support and Service Entitlement Management
The system shall allow authorised users to maintain service entitlement data for each institutional customer, including:

- support tier
- service hours
- named contacts
- escalation contacts
- SLA class
- incident severity matrix
- onboarding support entitlement
- training entitlement
- change request entitlement
- release communication preferences

### 1.11 Commercial Documents and Notes
The system shall support storage and retrieval of commercial documents and records, including:

- master service agreements
- licence agreements
- statements of work
- implementation plans
- pricing schedules
- renewal notices
- customer approvals
- commercial correspondence
- internal account notes

Access to commercial documents shall be permission-controlled.

### 1.12 Audit and Reporting
The system shall maintain a full audit trail for commercial and subscription management activities.

The system shall capture:

- record created or changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall provide reporting on:

- active institutional customers
- customers by deployment model
- subscriptions due for renewal
- suspended customers
- active modules by customer
- environment inventory
- usage by customer
- billing configuration completeness
- white-label customers
- commercial audit history

## 2. Pangea Backoffice

The Backoffice application shall be the central operational platform of the Pangea Pay suite.

It shall support the internal teams of both:
- the regulated institution using Pangea Pay for payment operations, and
- Limit Unlimited or authorised implementation/support users where contractually required and access is permitted.

The Backoffice shall support configurable operational models for remittance, wallet, virtual account, FX, payment, compliance, treasury, accounting, and reporting workflows.

### 2.1 Global Settings

The Backoffice shall allow authorised users to manage global and tenant-level settings required to operate the Pangea Pay suite in a controlled, auditable, and configurable manner.

Global settings shall be permission-controlled. Where the platform is deployed in a multi-tenant model, the system shall support separation between:

- platform-level settings managed by Limit Unlimited or designated super administrators
- tenant-level settings managed by authorised users of the regulated institution
- read-only visibility of inherited settings where tenant users are not permitted to modify platform-controlled values

The Backoffice shall support the following global settings capabilities.

#### 2.1.1 Core Setup
The system shall provide a Core Setup area showing the primary platform and tenant configuration required to operate the suite.

The Core Setup shall display, as applicable:

- legal entity name
- trading name
- tenant name
- base operating currency
- default timezone
- supported languages
- environment type
- platform version
- web application version
- mobile application version for iOS
- mobile application version for Android
- API version
- status of connected services
- configuration completeness indicator
- missing or invalid configuration warnings

Only authorised users with the relevant administrative permission shall be able to modify core setup values designated as editable.

#### 2.1.2 Country and Corridor Configuration
The system shall allow authorised users to configure countries and corridors supported by the tenant.

The country and corridor configuration shall support:

- adding, updating, activating, deactivating, and retiring countries
- designating a country as a send country, receive country, or both
- corridor-level activation and deactivation
- country-specific risk rating
- country restrictions
- supported currencies per country
- supported products and services per corridor
- permitted customer types per corridor
- permitted payout methods per corridor
- documentation or approval requirements for higher-risk corridors

The system shall prevent transaction initiation through inactive or restricted corridors.

#### 2.1.3 Currency Configuration
The system shall allow authorised users to manage currencies used within the suite.

Currency configuration shall include:

- ISO currency code
- currency name
- decimal precision
- display format
- active or inactive status
- settlement eligibility
- funding eligibility
- withdrawal eligibility
- FX conversion eligibility
- wallet holding eligibility
- virtual account eligibility where applicable
- tenant-specific restrictions where applicable

The system shall prevent the use of inactive currencies in new operational flows.

#### 2.1.4 Product and Service Configuration
The system shall allow authorised users to configure the products and services available within the tenant.

Product and service configuration shall support:

- product code
- product name
- product description
- product type
- product group
- target customer type
- active or inactive status
- eligible countries and corridors
- eligible currencies
- eligible funding methods
- eligible payout methods
- eligibility for web, mobile, backoffice, and API channels

Examples of products or services may include:

- wallet account
- multi-currency account
- virtual account
- remittance transfer
- domestic transfer
- bank transfer
- wallet transfer
- cash pickup
- FX conversion

#### 2.1.5 Payout Method Configuration
The system shall allow authorised users to add, update, activate, deactivate, and retire payout methods.

For each payout method, the system shall support configuration of:

- payout method code
- payout method name
- description
- applicable countries and corridors
- funding and payout restrictions
- operational cut-off times
- transaction value limits
- channel availability
- dependency on specific partners or integrations
- customer eligibility rules
- active or inactive status

If a payout method is deactivated, the system shall automatically prevent it from being used in new quotes, new transactions, and new product configuration selections.

#### 2.1.6 Funding Method Configuration
The system shall allow authorised users to configure supported funding methods.

Funding method configuration shall support:

- bank transfer
- card funding, where enabled
- wallet balance funding
- internal transfer
- open banking funding, where enabled
- manual funding route, where operationally permitted

For each funding method, the system shall support:

- activation status
- eligibility by customer type
- eligibility by country or corridor
- value limits
- velocity rules
- operational cut-off or settlement rules
- dependency on specific integrations or payment providers

#### 2.1.7 Pricing, Fee, and FX Configuration
The system shall allow authorised users to maintain pricing, fee, commission, spread, and related FX configuration rules.

The system shall support configuration of:

- corridor-level fees
- product-level fees
- customer-segment pricing
- fixed fees
- percentage fees
- minimum and maximum fee values
- waiver rules
- promotional pricing rules
- FX spread rules
- source rate hierarchy
- markup or markdown rules
- partner-specific pricing overrides
- effective start and end dates

All pricing and FX configuration changes shall be audit logged. Historical versions shall be retained for reporting, reconciliation, dispute handling, and regulatory review.

#### 2.1.8 Notification Template Settings
The system shall allow authorised users to create, update, activate, deactivate, and retire notification templates.

Notification template settings shall support:

- email templates
- SMS templates
- push notification templates
- in-app messages where applicable
- event-based template mapping
- template versioning
- language selection
- tenant or white-label branding variables
- dynamic merge fields
- approval workflow for sensitive templates where configured

The system shall maintain a record of template change history.

#### 2.1.9 Application Security Settings
The system shall provide configuration for application security controls, including:

- password policy
- MFA policy
- session timeout and session renewal rules
- login attempt controls
- device or browser trust policy where applicable
- IP or geo-access restrictions where applicable
- privileged access controls
- security event notification settings
- audit and security logging settings
- security settings change control

Security settings shall support global defaults and, where permitted, tenant-level overrides.

#### 2.1.10 Integration Configuration Parameters
The system shall provide a controlled configuration area for managing technical and business parameters used in third-party integrations.

The integration configuration shall support, at minimum:

- integration registry
- integration type
- provider name
- purpose
- environment designation
- endpoint references
- credential reference identifiers
- callback configuration
- timeout and retry parameters
- operational routing priority
- status
- support ownership
- failover rules where applicable

Sensitive credentials shall not be displayed in plain text to normal administrative users. The system shall support secure reference-based storage for secrets.

#### 2.1.11 Feature Flags and Operational Controls
The system shall provide a controlled framework for enabling, disabling, or adjusting application features and operational behaviour without requiring code deployment for every change.

The system shall support:

- feature flag creation and maintenance
- application-specific activation
- environment-specific activation
- user-segment or role-based activation
- customer-segment activation
- corridor-level or country-level activation
- operational controls for registration, onboarding, transfers, funding methods, payout methods, and integrations
- maintenance mode
- emergency shutdown controls
- scheduled activation and expiry
- dependency validation
- scope visibility and impact preview
- maker-checker approval for high-impact production controls
- dashboard view of active and scheduled controls

#### 2.1.12 Data Standardisation and Reference Data
The system shall support controlled master data and reference data management.

Reference data shall include, as applicable:

- countries
- currencies
- cities and regions
- document types
- customer types
- risk categories
- business sectors
- source of funds categories
- purpose of transaction categories
- occupation categories
- alert categories
- case types
- account status codes
- transaction status codes

Where possible, the platform shall rely on standardised values and reference lists instead of uncontrolled free-text entry.

#### 2.1.13 Business Rules and Threshold Configuration
The system shall allow authorised users to configure business rules and thresholds relevant to customer, account, and transaction processing.

This shall include, as applicable:

- customer-level limits
- wallet balance limits
- transaction value limits
- daily, weekly, monthly, and annual limits
- corridor-specific limits
- funding and payout method restrictions
- age or residency restrictions
- risk-based approval thresholds
- manual review thresholds
- dormant-account rules
- document expiry reminders
- customer review cycle rules

The system shall maintain an audit trail of business rule changes.

#### 2.1.14 Audit and Change Traceability
The system shall maintain a full audit trail for all changes made through the global settings area.

The audit trail shall capture:

- setting name
- record identifier where applicable
- previous value
- new value
- user making the change
- date and time of change
- reason for change where applicable
- approval details where applicable
- environment and tenant context

The system shall provide authorised users with searchable audit visibility and export functionality for settings changes.

---

### 2.2 User and Role Management

The Backoffice shall support controlled administration of internal users, roles, permissions, authentication policies, and privileged access activities.

The user and role management model shall support least-privilege access and segregation of duties.

#### 2.2.1 User Types
The system shall support different categories of internal users, including:

- tenant operational users
- tenant compliance users
- tenant finance and treasury users
- tenant customer support users
- tenant administrators
- implementation or support users from Limit Unlimited where contractually permitted
- read-only audit or oversight users where required

The system shall support restriction of user access by tenant, environment, role, and functional scope.

#### 2.2.2 User Creation
The system shall allow authorised users to create internal user records.

For each user, the system shall support capture of:

- first name
- last name
- work email
- mobile number
- job title
- department or function
- tenant affiliation
- default language
- timezone where applicable
- user status
- MFA requirement
- permitted environments
- notes where applicable

The system shall validate uniqueness of the login identifier within the applicable scope.

#### 2.2.3 User Onboarding and Activation
The system shall support a secure user onboarding process.

The onboarding process shall support:

- invitation by email
- time-bound activation link
- initial credential setup
- MFA enrolment where required
- acknowledgement of acceptable use or security policy where configured
- forced password change on first login where applicable

The system shall prevent login before account activation is completed.

#### 2.2.4 User Status Management
The system shall support user lifecycle statuses including:

- invited
- pending activation
- active
- suspended
- locked
- deactivated
- archived

The system shall define the operational behaviour of each status.

At minimum:

- suspended users shall not be able to log in, but their records shall remain active for reporting and audit
- locked users shall be temporarily prevented from login due to policy or security events
- deactivated users shall be fully disabled from operational access
- archived users shall be retained for recordkeeping and audit purposes

#### 2.2.5 Role Assignment
Each active user shall be assigned at least one role unless a specific exception model is configured.

The system shall support:

- single-role assignment
- multi-role assignment
- effective date for role assignment
- expiry date for temporary role assignment
- environment-specific role assignment where required
- tenant-scoped role assignment
- approval workflow for privileged role assignment where configured

#### 2.2.6 Role Management
The system shall allow authorised users to create, update, activate, deactivate, and retire roles.

Each role shall support:

- role name
- role description
- owning function
- applicable user type
- environment applicability
- tenant applicability
- permission set
- privileged access flag where applicable
- approval requirement flag where applicable
- active or inactive status

The system shall prevent deletion of roles that are actively assigned unless reassignment or retirement rules are satisfied.

#### 2.2.7 Permission Model
The system shall support a granular permission model across all Backoffice functions.

Permissions shall support, as applicable:

- no access
- view
- create
- edit
- approve
- delete
- export
- override
- configuration access
- administrative access

The permission model shall support assignment by module, sub-module, action, and object type.

#### 2.2.8 Privileged Access Controls
The system shall identify and control privileged access, including but not limited to:

- user administration
- role administration
- security settings
- integration configuration
- operational shutdown controls
- transaction override actions
- wallet or account adjustments
- manual ledger postings
- production environment administration

The system shall support additional controls for privileged users, including:

- mandatory MFA
- stricter session policy
- enhanced audit logging
- approval workflow for sensitive actions where configured

#### 2.2.9 Password and Authentication Management
The system shall enforce authentication policies defined in the Global Settings section.

The user and role management area shall support:

- password reset initiation
- forced password reset
- password expiry handling where configured
- account unlock processes
- MFA reset under controlled process
- re-enrolment of MFA device
- login activity visibility for authorised users
- authentication event logging

Sensitive reset actions shall be subject to appropriate permission control and, where required, maker-checker approval.

#### 2.2.10 Session and Access Control
The system shall enforce session management and access control rules, including:

- session timeout
- concurrent session rules
- IP or network restrictions where configured
- device trust rules where configured
- environment-specific access restrictions
- tenant scoping
- login hour restrictions where configured

The system shall log material access events, including successful login, failed login, lockout, MFA failure, password reset, suspension, and deactivation.

#### 2.2.11 Delegation and Temporary Access
Where operationally required, the system may support temporary delegated access.

If enabled, delegated access shall support:

- delegation from one authorised user to another
- scope-limited permission delegation
- start and end date
- reason for delegation
- approval requirement
- full audit logging

Delegated access shall expire automatically at the end of the approved period.

#### 2.2.12 User Directory and Search
The system shall provide a searchable internal user directory.

Authorised users shall be able to search, filter, and review users by:

- name
- email
- role
- department
- tenant
- environment
- status
- MFA status
- last login date
- creation date
- suspension status

#### 2.2.13 Audit and Reporting
The system shall maintain a full audit trail for user, role, and permission management activities.

The audit trail shall capture:

- user or role affected
- field changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall provide reporting on:

- active users by tenant
- privileged users
- users without recent login
- locked or suspended users
- MFA compliance
- role assignments
- permission changes
- dormant accounts

---

### 2.3 Customer and Customer User Management

The Backoffice shall support operational management of retail and business customers, including customer profile maintenance, onboarding review, lifecycle management, linked users, risk visibility, and account servicing actions.

The customer management model shall support both individual customers and business customers.

#### 2.3.1 Customer Record Types
The system shall support, at minimum, the following customer record types:

- individual customer
- business customer
- prospective customer
- rejected customer
- dormant customer
- suspended or restricted customer
- closed customer

The system shall allow tenant-specific classification and segmentation of customers.

#### 2.3.2 Customer Profile Management
The system shall maintain a complete customer profile for each customer.

For individual customers, the profile may include:

- full legal name
- preferred name
- date of birth
- nationality
- country of residence
- tax residency where applicable
- contact details
- address details
- occupation
- source of funds information
- customer risk category
- onboarding status
- screening status
- account status
- linked wallets, accounts, and virtual accounts

For business customers, the profile may include:

- legal entity name
- trading name
- registration number
- incorporation country
- registered address
- operating address
- business type
- nature of business
- ownership structure
- directors
- shareholders
- UBO details
- authorised signatories
- source of funds / source of wealth information
- risk category
- onboarding status
- screening status
- account status
- linked wallets, accounts, and virtual accounts

#### 2.3.3 Customer User Management
For business customers, the system shall support multiple customer users linked to the same customer account or organisational profile.

The system shall support, as applicable:

- primary administrator user
- business owner or authorised representative
- finance user
- operational user
- read-only user
- custom permission group where enabled

For each customer user, the system shall support:

- user identity details
- contact details
- user status
- permission level
- linked customer entity
- MFA status where applicable
- invitation and activation status
- last login visibility where available
- audit history

#### 2.3.4 Account Rights and Access Rights
The system shall support maintenance of customer account rights and user rights for linked customer users.

The system shall allow authorised backoffice users to review, and where permitted manage:

- which customer users can access which wallets or accounts
- whether a user is the business owner user
- approval rights for payments or conversions where applicable
- initiation-only or read-only rights
- rights by account, product, or currency where applicable
- rights activation and deactivation dates

The system shall retain a record of all account-right changes.

#### 2.3.5 Onboarding and KYC / KYB Review
The system shall allow authorised users to review onboarding status and KYC / KYB outcomes.

The Backoffice shall support visibility of:

- registration status
- document submission status
- verification status
- screening results
- pending information requests
- onboarding decision history
- rejection or referral reasons
- outstanding actions
- review ownership

The system shall allow authorised users to request additional information or documents from the customer.

#### 2.3.6 Customer Status Management
The system shall support controlled lifecycle management of customer status.

Customer statuses may include:

- draft
- pending onboarding
- pending information
- under review
- active
- restricted
- suspended
- rejected
- closed
- archived

The system shall support permission-controlled status changes and capture the reason for material status updates.

#### 2.3.7 Risk and Compliance Visibility
The customer profile shall provide authorised users with consolidated risk and compliance visibility, including:

- sanctions screening status
- PEP status
- adverse media status where applicable
- customer risk score or category
- monitoring alerts linked to the customer
- case references
- previous escalations
- document expiry flags
- review due indicators

#### 2.3.8 Customer Notes, Reminders, and Tasks
The system shall allow authorised users to add and maintain customer-related notes, reminders, and operational tasks.

This shall support:

- general servicing notes
- compliance notes
- relationship notes
- follow-up reminders
- periodic review reminders
- document renewal reminders
- task ownership
- target completion date
- note visibility restrictions where applicable

The system shall preserve authorship and timestamp for all notes.

#### 2.3.9 Communication History
The system shall provide visibility of customer communications where integrated or recorded in the platform.

Communication history may include:

- emails sent
- emails received where integrated
- SMS history
- push notifications
- in-app messages
- onboarding requests
- servicing messages
- operational alerts to the customer

Where technically supported, the system may display delivery status and read status of communications.

#### 2.3.10 Linked Records and Relationship View
The customer profile shall provide a consolidated relationship view showing linked operational records, including:

- customer users
- wallets and current accounts
- virtual accounts
- beneficiaries and counterparties
- cards, where enabled in future
- transactions
- FX conversions
- documents
- compliance alerts and cases
- notes and reminders
- communication records

#### 2.3.11 Blacklist and Restriction Handling
The system shall support controlled handling of blacklisting or customer restriction requests.

The system shall allow authorised users to:

- submit a blacklist or restriction request
- record reason and evidence
- record approving authority where required
- apply restriction type
- set effective date
- review existing restrictions
- remove restrictions subject to approval and audit requirements

Restriction types may include:

- onboarding block
- transaction block
- payout block
- withdrawal block
- account freeze
- communication block
- full customer block

#### 2.3.12 Customer Search and Register
The system shall provide a customer register and advanced search facility.

Authorised users shall be able to search and filter by:

- customer name
- customer reference
- business registration number
- email
- phone number
- country
- customer type
- onboarding status
- risk category
- screening status
- account status
- account number or virtual account reference
- date created
- review due status

The customer register shall support export permissions where authorised.

#### 2.3.13 Audit and History
The system shall maintain a complete audit history for customer record changes.

The audit history shall include:

- customer field changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall also provide visibility of material historical events, including onboarding decisions, status changes, restriction events, and linked-user changes.

### 2.4 Wallet and Current Account Management

The Backoffice shall support creation, review, servicing, control, and lifecycle management of customer wallets and current accounts.

The platform shall support wallet and current account models for both individual and business customers, subject to product configuration and regulatory requirements.

A wallet or current account may be configured as:

- single-currency
- multi-currency
- customer-owned
- business-owned
- operationally restricted
- dormant
- suspended
- closed

#### 2.4.1 Wallet and Account Record Creation
The system shall allow authorised users or authorised automated processes to create wallet or current account records for eligible customers.

Each wallet or account record shall include, as applicable:

- unique account identifier
- account number or internal reference
- linked customer reference
- linked customer type
- product type
- product code
- account category
- single-currency or multi-currency designation
- base currency where applicable
- account status
- opening date
- activation date
- suspension date where applicable
- closure date where applicable
- servicing tenant
- country or region applicability
- operational notes

The system shall prevent creation of duplicate active accounts where configured business rules prohibit duplication.

#### 2.4.2 Account Status Lifecycle
The system shall support controlled wallet or account lifecycle statuses, including:

- pending creation
- pending activation
- active
- restricted
- suspended
- frozen
- dormant
- closing
- closed
- archived

The system shall define the operational behaviour of each status.

At minimum:

- restricted accounts may remain visible while selected capabilities are disabled
- suspended accounts shall not permit new outbound activity
- frozen accounts shall prevent movement of funds except where authorised for regulatory, fraud, or operational reasons
- dormant accounts shall be subject to dormant-account rules and servicing controls
- closed accounts shall not permit new operational activity

#### 2.4.3 Multi-Currency Balance Management
For multi-currency products, the system shall support management of one or more balances under a single wallet or account relationship.

The system shall support:

- separate balance by currency
- available balance
- reserved balance
- blocked balance
- pending balance where required
- balance status by currency
- activation or deactivation of supported currencies
- permitted holding currencies by product
- balance-level restrictions where applicable

The system shall ensure that balances are maintained with appropriate decimal precision for the relevant currency.

#### 2.4.4 Account Funding Visibility
The Backoffice shall provide visibility of account funding activity and funding eligibility.

The system shall support review of:

- permitted funding methods
- inbound funding events
- pending funding events
- failed funding events
- funding references
- funding source type
- funding status
- date and time of funding
- linked transaction or ledger reference
- source integration where applicable

Where operationally permitted, the Backoffice may support manual confirmation or rejection of exceptional funding items subject to approval controls.

#### 2.4.5 Outbound Usage and Withdrawal Controls
The system shall support controlled outbound usage of wallets and current accounts.

The Backoffice shall allow authorised users to review and, where permitted, manage:

- transfer eligibility
- remittance eligibility
- FX conversion eligibility
- withdrawal eligibility
- beneficiary payment eligibility
- outbound limits
- restricted payout methods
- account-specific blocks
- temporary or permanent outbound restrictions

The system shall prevent outbound use where the account status, balance status, or applicable controls prohibit the action.

#### 2.4.6 Account Review and Servicing
The system shall provide a detailed wallet or account profile for authorised users.

The account profile shall include, as applicable:

- linked customer summary
- linked customer users
- product information
- account status
- currencies enabled
- balance view by currency
- transaction summary
- funding history
- withdrawal history
- FX conversion history
- restrictions and flags
- linked virtual accounts
- linked beneficiaries or counterparties where relevant
- notes, reminders, and servicing tasks
- audit history

#### 2.4.7 Holds, Freezes, and Restrictions
The system shall support account-level restrictions and controls.

Authorised users shall be able, subject to permission and approval rules, to apply or remove:

- debit block
- credit block
- full freeze
- partial restriction
- payout restriction
- FX restriction
- funding restriction
- compliance hold
- fraud hold
- operational hold

For each restriction, the system shall capture:

- restriction type
- scope
- effective date
- expiry date where applicable
- reason
- supporting notes
- user applying the restriction
- approval details where applicable

#### 2.4.8 Account Limits and Thresholds
The system shall support account-specific and product-specific limits.

Limits may include:

- maximum balance
- maximum inbound transaction value
- maximum outbound transaction value
- daily transfer limit
- monthly transfer limit
- conversion limit
- cumulative velocity limits
- withdrawal limit
- corridor-specific limits
- customer-risk-based limits

The system shall enforce active limits automatically in operational flows.

#### 2.4.9 Dormancy, Closure, and Reopening
The system shall support dormant-account, closure, and controlled reopening processes.

The Backoffice shall support:

- automatic or manual marking of dormancy
- dormancy review reminders
- customer communication triggers for dormancy or closure
- closure workflow
- reason for closure capture
- balance disposition handling
- reopening requests where permitted
- approval workflow for reopening where required

The system shall prevent closure if unresolved balances, restrictions, investigations, or pending items remain, unless an authorised override process is followed.

#### 2.4.10 Account Statements and Activity View
The system shall allow authorised users to review and, where permitted, export account statements and activity history.

The system shall support:

- statement by account
- statement by currency
- statement by date range
- running balance view
- downloadable statement formats where configured
- reference to linked financial and operational events
- inclusion of opening and closing balances
- transaction narrative where available

#### 2.4.11 Manual Adjustments and Exceptional Servicing
Where contractually and operationally permitted, the system may support exceptional wallet or account servicing actions by authorised users.

Such actions may include:

- corrective balance adjustments
- release of blocked balance
- manual reservation removal
- account metadata correction
- exceptional status update
- linked record correction

Any action affecting balances, restrictions, or financial state shall be tightly permission-controlled, fully audit logged, and subject to maker-checker approval where required.

#### 2.4.12 Linked Ledger and Reconciliation References
The system shall maintain linkage between wallet or account activity and associated financial records.

The Backoffice shall provide visibility of:

- related ledger entries
- journal references
- funding references
- payout references
- settlement references
- reconciliation status
- exception identifiers where applicable

#### 2.4.13 Audit and Reporting
The system shall maintain a full audit trail for wallet and current account management activity.

The audit trail shall capture:

- account identifier
- field changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall provide reporting on:

- active accounts
- accounts by product
- accounts by status
- dormant accounts
- frozen or restricted accounts
- balances by currency
- accounts pending closure
- account servicing actions
- exceptional adjustments


### 2.5 Virtual Account Management

The Backoffice shall support issuance, configuration, servicing, status management, and monitoring of virtual accounts linked to eligible customer wallets, current accounts, or product arrangements.

A virtual account may be used to support customer identification, inbound payment routing, collection use cases, or account funding use cases, depending on product and integration design.

#### 2.5.1 Virtual Account Record Creation
The system shall allow authorised users or authorised automated processes to create virtual account records for eligible customers or eligible wallets/accounts.

Each virtual account record shall include, as applicable:

- unique virtual account identifier
- linked customer reference
- linked wallet or current account reference
- linked product reference
- currency
- country or jurisdiction
- account number or account reference
- sort code, IBAN, routing identifier, or equivalent where applicable
- provider or issuing partner
- issue date
- activation date
- expiry date where applicable
- status
- purpose or usage type
- notes

The system shall support one-to-one and one-to-many relationships between customer accounts and virtual accounts where permitted by product design.

#### 2.5.2 Virtual Account Status Lifecycle
The system shall support lifecycle statuses for virtual accounts, including:

- pending issue
- active
- restricted
- suspended
- closed
- expired
- archived

The system shall define the operational meaning of each status and enforce relevant restrictions in downstream activity.

#### 2.5.3 Virtual Account Assignment Rules
The system shall support configurable assignment rules for virtual accounts.

Assignment rules may include:

- individual customer assignment
- business customer assignment
- one virtual account per currency
- one virtual account per product
- one virtual account per customer
- shared virtual account model where operationally supported
- region-specific assignment
- provider-specific assignment

The system shall prevent issuance where assignment rules, product eligibility rules, or integration availability do not permit the request.

#### 2.5.4 Inbound Routing and Mapping
The system shall support linkage between inbound funds received on a virtual account and the corresponding customer wallet, account, or operational ledger destination.

The Backoffice shall provide visibility of:

- inbound routing target
- expected currency
- provider reference
- inbound transaction history
- unmatched inbound items
- pending allocation items
- rejected inbound items
- reconciliation status
- exception flags

The system shall support investigation workflows for inbound payments that cannot be automatically matched.

#### 2.5.5 Virtual Account Usage Controls
The system shall support configuration and review of virtual account usage rules.

Usage controls may include:

- permitted inbound currencies
- permitted inbound source countries where applicable
- expected use case
- transaction value limits
- velocity limits
- funding-only usage
- collection-only usage
- customer-specific restrictions
- expiry handling
- provider restrictions

The system shall prevent operational use outside configured usage rules where technically enforceable.

#### 2.5.6 Provider and Integration Visibility
The system shall show the provider and integration context for each virtual account.

This shall include, as applicable:

- issuing partner
- provider account or scheme reference
- API or file-based integration type
- service status
- callback status
- operational routing notes
- exception history
- support ownership

#### 2.5.7 Servicing and Maintenance
The system shall allow authorised users to service virtual account records, subject to permission and provider constraints.

Permitted servicing actions may include:

- activate
- suspend
- restrict
- close
- reissue
- update metadata
- add servicing note
- assign internal task
- escalate exception

The system shall validate whether a servicing action is locally controlled, provider-controlled, or requires partner confirmation.

#### 2.5.8 Monitoring and Exception Handling
The Backoffice shall support monitoring and investigation of virtual account operational issues.

This shall include visibility of:

- failed issuance requests
- delayed activation
- inbound transaction mismatches
- provider callback failures
- restricted or suspended virtual accounts
- expired virtual accounts
- unresolved reconciliation items
- duplicate or conflicting assignment issues

#### 2.5.9 Customer View Alignment
The system shall support alignment between Backoffice records and customer-facing display rules.

Where applicable, the Backoffice shall control or reflect:

- whether a virtual account is visible to the customer
- display name or label
- currency label
- local banking details shown to the customer
- usage instructions
- restrictions communicated to the customer

#### 2.5.10 Linked Records and History
Each virtual account profile shall provide visibility of linked operational records, including:

- customer profile
- linked wallet or account
- inbound transactions
- funding events
- reconciliation items
- notes and tasks
- provider interactions
- status history
- audit history

#### 2.5.11 Audit and Reporting
The system shall maintain a full audit trail for virtual account lifecycle and servicing activities.

The audit trail shall capture:

- virtual account identifier
- field changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall provide reporting on:

- active virtual accounts
- virtual accounts by currency
- virtual accounts by provider
- virtual accounts by status
- suspended or expired virtual accounts
- issuance failures
- unmatched inbound items
- virtual-account-linked funding volumes

### 2.6 Beneficiary and Counterparty Management

The Backoffice shall support maintenance, review, validation, and control of beneficiary and counterparty records used in payments, remittance, funding, and account-transfer workflows.

The system shall support both personal and business beneficiaries / counterparties.

#### 2.6.1 Beneficiary and Counterparty Record Types
The system shall support, as applicable, the following record types:

- remittance beneficiary
- domestic payment beneficiary
- international payment beneficiary
- wallet transfer counterparty
- internal transfer counterparty
- business payee
- sender funding source counterparty where modelled
- restricted or blacklisted beneficiary

The exact record model may vary by product, corridor, and operational design.

#### 2.6.2 Record Creation and Maintenance
The system shall allow authorised users to create, update, review, deactivate, and reactivate beneficiary or counterparty records subject to permission controls.

Each record shall include, as applicable:

- beneficiary or counterparty reference
- linked customer reference
- linked customer user where relevant
- beneficiary type
- full name or business name
- nickname or label
- country
- currency
- payout method
- bank or wallet details
- relationship to customer where required
- contact details where applicable
- status
- validation status
- screening status
- created date
- last updated date

The system shall validate mandatory fields by payout method and corridor.

#### 2.6.3 Corridor- and Method-Specific Data Rules
The system shall support data capture rules based on corridor, currency, and payout method.

Depending on use case, required data may include:

- bank name
- bank code
- branch code
- IBAN
- account number
- routing number
- SWIFT / BIC
- mobile wallet number
- beneficiary address
- date of birth
- purpose of payment
- relationship to sender
- business registration details
- tax identifier where required

The system shall prevent creation or activation of beneficiary records that do not satisfy applicable validation rules.

#### 2.6.4 Verification and Validation Status
The system shall support beneficiary and counterparty validation states, including:

- draft
- pending validation
- validated
- rejected
- restricted
- inactive

Validation may include:

- format validation
- field completeness validation
- partner-side validation where integrated
- sanctions or screening review
- duplicate detection
- manual review outcome

#### 2.6.5 Duplicate Detection and Matching
The system shall support duplicate detection and similarity checks for beneficiary or counterparty records.

The system may compare, as applicable:

- name
- bank account number
- IBAN
- wallet number
- mobile number
- country
- linked customer
- business registration number

The system shall alert authorised users to possible duplicates and support controlled merge, retain, or reject decisions where operationally appropriate.

#### 2.6.6 Status and Restriction Controls
The system shall support status management and restriction controls for beneficiary and counterparty records.

Restriction actions may include:

- deactivation
- payment block
- corridor block
- payout-method block
- temporary hold
- full restriction
- blacklist designation

The system shall capture the reason, effective date, user action, and approval details where required.

#### 2.6.7 Screening and Risk Visibility
The Backoffice shall provide visibility of beneficiary-related compliance indicators, including:

- sanctions screening status
- PEP indicator where applicable
- adverse media indicator where applicable
- screening alert references
- review notes
- risk category where applicable
- restriction history

#### 2.6.8 Beneficiary Ownership and Access
For business customers or multi-user customer models, the system shall support controlled access to beneficiary records.

The system shall support, as applicable:

- customer-level beneficiary ownership
- business-user visibility rules
- shared beneficiary model
- personal beneficiary model
- maker-checker approval for new beneficiaries where configured
- approval rights by customer user role where supported in the customer-facing channel

The Backoffice shall allow authorised users to review the ownership and approval structure of a beneficiary record.

#### 2.6.9 Activity and Usage History
Each beneficiary or counterparty profile shall provide visibility of linked operational activity, including:

- transactions initiated
- successful payouts
- failed payouts
- last-used date
- linked corridors
- linked payout methods
- exception events
- compliance events
- note history
- audit history

#### 2.6.10 Customer Servicing and Exception Handling
The system shall allow authorised backoffice users to support beneficiary-related servicing actions, including:

- correction of non-financial metadata
- request for additional information
- activation or deactivation
- escalation of validation issue
- escalation of screening issue
- exception note entry
- linkage to case management process where required

Changes to payout-critical data may be restricted or require revalidation, reapproval, or customer-side confirmation.

#### 2.6.11 Search and Register
The system shall provide a beneficiary and counterparty register with advanced search capability.

Authorised users shall be able to search and filter by:

- beneficiary name
- beneficiary reference
- linked customer
- country
- currency
- payout method
- bank account or masked account reference
- wallet number or masked wallet reference
- status
- validation status
- screening status
- date created
- last-used date

The register shall support export permissions where authorised.

#### 2.6.12 Audit and Reporting
The system shall maintain a full audit trail for beneficiary and counterparty management activity.

The audit trail shall capture:

- beneficiary or counterparty identifier
- field changed
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable

The system shall provide reporting on:

- active beneficiaries
- beneficiaries by corridor
- beneficiaries by payout method
- inactive or restricted beneficiaries
- validation exceptions
- screening exceptions
- duplicate candidates
- beneficiary usage trends

### 2.7 FX and Pricing Management

The Backoffice shall support configuration, review, approval, monitoring, and operational servicing of FX rates, spreads, fees, commissions, and related pricing rules used across wallet, account, payment, remittance, and virtual account journeys.

The FX and pricing model shall support tenant-specific configuration, product-level pricing, corridor-level pricing, customer-segment pricing, and partner-specific pricing where applicable.

#### 2.7.1 Reference Rate Management
The system shall support storage and review of reference FX rates used as the basis for customer and partner pricing.

Reference rate management shall support, as applicable:

- currency pair
- direct or indirect quote
- source provider
- source timestamp
- buy rate
- sell rate
- mid-market rate
- environment
- active or inactive status
- historical version retention

The system shall support one or more reference rate sources and shall maintain a historical record of rates for audit, reporting, reconciliation, and dispute review.

#### 2.7.2 Customer Rate Configuration
The system shall allow authorised users to configure customer-facing FX rates derived from reference rates.

Customer rate configuration shall support:

- spread over reference rate
- fixed markup or markdown
- product-specific pricing
- corridor-specific pricing
- customer-segment pricing
- promotional pricing
- campaign-specific pricing
- tenant-specific pricing overrides
- effective date and time
- expiry date and time

The system shall support different pricing models for:

- wallet conversion
- account conversion
- remittance transfer
- domestic payment where FX applies
- partner or API-initiated transactions
- business customer pricing where applicable

#### 2.7.3 Fee Configuration
The system shall allow authorised users to configure fees applicable to products, services, and transaction types.

Fee configuration shall support, as applicable:

- fixed fee
- percentage fee
- tiered fee
- minimum fee
- maximum fee
- corridor-specific fee
- product-specific fee
- payout-method-specific fee
- customer-type-specific fee
- customer-segment-specific fee
- waiver rules
- promotional fee rules
- partner or API pricing overrides

The system shall support separate treatment of:

- customer fees
- partner fees
- operational charges
- funding charges
- withdrawal charges
- FX conversion charges
- implementation of no-fee products where applicable

#### 2.7.4 Commission Configuration
Where the business model includes commission sharing, the system shall allow authorised users to configure commissions and revenue-sharing arrangements.

Commission configuration shall support:

- commission type
- fixed commission
- percentage commission
- tiered commission
- product-level commission
- corridor-level commission
- partner-level commission
- tenant-specific commission arrangements
- effective dates
- expiry dates
- settlement basis

The system shall maintain clear distinction between customer pricing, internal revenue, and partner commission obligations.

#### 2.7.5 FX Quote Generation Support
The Backoffice shall provide visibility of FX quote logic and operational quote outputs used in customer-facing or partner-facing journeys.

The system shall support visibility of:

- quoted currency pair
- source rate
- applied spread or markup
- quoted rate
- send amount
- receive amount
- quoted fee
- validity period
- quote status
- quote channel
- quote reference
- quote timestamp
- linked customer or partner where applicable

The system shall support audit review of how a quote was derived.

#### 2.7.6 Quote Validity and Expiry Rules
The system shall support configurable quote validity rules.

Quote validity controls shall support:

- default validity period by product
- corridor-specific validity period
- high-volatility currency pair rules
- partner-specific validity period
- reprice requirements on expiry
- tolerance handling where configured

The system shall prevent execution of expired quotes unless an authorised override model is explicitly configured.

#### 2.7.7 FX Conversion Deal Management
The system shall support recording and review of FX conversion deals linked to customer activity, treasury activity, or operational hedging where applicable.

Each FX deal record may include:

- deal reference
- deal type
- currency pair
- amount sold
- amount bought
- agreed rate
- spread applied
- linked customer or internal account
- linked transaction or conversion request
- deal timestamp
- execution status
- settlement status
- provider or counterparty
- notes

The system shall support both automatically generated and manually recorded deal references where operationally permitted.

#### 2.7.8 Pricing Approval Controls
The system shall support maker-checker or approval controls for sensitive pricing and FX changes.

Approval controls may apply to:

- production spread changes
- corridor fee changes
- partner-specific pricing overrides
- promotional pricing activation
- high-impact commission changes
- emergency repricing

The system shall capture approval status, approving user, date and time, and reason where required.

#### 2.7.9 Customer and Partner Segmentation
The system shall support pricing and FX rules by segment.

Supported segmentation may include:

- retail customer
- business customer
- VIP or preferred customer
- regulated partner
- aggregator client
- tenant-specific segment
- country or corridor segment
- risk category segment
- promotional segment

The system shall allow one pricing rule to be active for one segment while a different rule applies to another.

#### 2.7.10 Operational Monitoring and Exception Handling
The Backoffice shall support monitoring of pricing and FX-related operational issues.

This shall include visibility of:

- missing rate conditions
- stale reference rates
- missing fee configuration
- invalid pricing hierarchy
- failed quote generation
- out-of-tolerance pricing exceptions
- provider rate feed failure
- deal execution mismatch
- pricing approval pending items

The system shall support controlled investigation and correction workflows.

#### 2.7.11 Historical Rate and Pricing Visibility
The system shall retain historical records of:

- reference rates
- quoted rates
- applied spreads
- fees
- commissions
- pricing rule versions
- approval history

Authorised users shall be able to review historical pricing for a given date, customer, corridor, product, or transaction.

#### 2.7.12 Search, Register, and Reporting
The system shall provide searchable registers and reports for FX and pricing data.

Authorised users shall be able to search and filter by:

- currency pair
- corridor
- product
- customer segment
- rate source
- fee type
- commission type
- status
- effective date
- expiry date
- tenant
- provider

The system shall provide reporting on:

- active rate configurations
- expiring promotional pricing
- FX deal volumes
- fee income
- FX income
- commission liabilities
- stale rate incidents
- pricing exceptions

#### 2.7.13 Audit and Traceability
The system shall maintain a full audit trail for FX and pricing management activities.

The audit trail shall capture:

- pricing or rate record affected
- old value and new value
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable
- tenant and environment context

---

### 2.8 Payment and Transaction Operations

The Backoffice shall support operational processing, review, control, investigation, and lifecycle management of payments, transfers, remittance transactions, account transfers, and related operational events.

The transaction operations model shall support customer-initiated, partner-initiated, API-initiated, and backoffice-assisted transaction flows, subject to permission and control rules.

#### 2.8.1 Supported Transaction Types
The system shall support, as applicable, the following transaction types:

- remittance transfer
- domestic payment
- international payment
- wallet-to-wallet transfer
- account-to-account transfer
- funding transaction
- withdrawal transaction
- FX conversion-linked payment
- virtual-account-linked inbound funding
- internal operational transfer
- refund transaction
- reversal transaction

The exact set of supported transaction types shall depend on product configuration, integration availability, tenant entitlement, and regulatory design.

#### 2.8.2 Transaction Record Creation and Retrieval
The system shall maintain a transaction record for each operational payment or money movement event.

Each transaction record shall include, as applicable:

- unique transaction reference
- external reference
- linked customer
- linked customer user where relevant
- transaction type
- product
- source account or wallet
- destination beneficiary or counterparty
- send currency
- receive currency
- send amount
- receive amount
- quoted or applied FX rate
- fee amount
- funding method
- payout method
- channel
- source integration or partner
- destination integration or partner
- transaction status
- creation timestamp
- last status timestamp
- related ledger references
- notes and exception flags

The Backoffice shall allow authorised users to retrieve transaction records through advanced search and filtered registers.

#### 2.8.3 Transaction Lifecycle Status Management
The system shall support controlled lifecycle statuses for transactions.

Indicative statuses may include:

- draft
- pending customer action
- pending onboarding
- pending validation
- pending screening
- pending approval
- awaiting funds
- funded
- queued for processing
- submitted to partner
- in progress
- paid
- failed
- cancelled
- refunded
- reversed
- on hold
- under investigation
- partially completed where applicable
- archived

The system shall maintain a historical record of all status changes and the corresponding date and time.

#### 2.8.4 Operational Processing View
The Backoffice shall provide an operational processing view for authorised users to review and manage transactions.

This shall support visibility of:

- current transaction status
- queue location
- validation outcome
- screening outcome
- approval status
- funding status
- payout submission status
- partner response
- callback status
- exception flags
- linked notes
- linked cases
- linked ledger and reconciliation references

#### 2.8.5 Validation and Pre-Processing Controls
The system shall apply validation and control checks before operational execution.

Validation controls may include:

- customer eligibility
- account status
- available balance
- limit checks
- beneficiary status
- corridor availability
- payout method availability
- pricing availability
- funding method availability
- duplicate or replay prevention
- velocity checks
- required data completeness
- integration route availability

The Backoffice shall provide visibility of validation failures and the reasons for rejection or referral.

#### 2.8.6 Approval and Maker-Checker Controls
The system shall support approval workflows for transactions where required by product, risk rules, value threshold, or operational policy.

Approval controls may apply to:

- high-value transactions
- business customer payments
- first-time beneficiary payments
- exception transactions
- backoffice-assisted transactions
- manual repair or override actions
- refunds
- reversals
- release from hold

The system shall record approval status, approving user, approval timestamp, and notes where applicable.

#### 2.8.7 Hold, Release, Cancel, Fail, Refund, and Reverse Actions
The system shall allow authorised users, subject to permissions and controls, to perform transaction servicing actions.

Permitted actions may include:

- place on hold
- release from hold
- cancel before execution
- mark failed under controlled process
- initiate refund
- initiate reversal where supported
- escalate for investigation
- requeue for processing where permitted

For each servicing action, the system shall capture:

- action type
- reason
- user performing the action
- date and time
- approval details where applicable
- linked notes
- impact on funds, balances, and downstream records

#### 2.8.8 Funding and Payout Status Visibility
The Backoffice shall provide visibility of both funding-side and payout-side transaction progression.

Funding-side visibility may include:

- funding initiated
- funding pending
- funding confirmed
- funding failed
- funding reversed

Payout-side visibility may include:

- payout queued
- payout submitted
- payout acknowledged
- payout in progress
- payout completed
- payout failed
- payout rejected
- payout returned

The system shall allow authorised users to understand where in the operational chain a transaction currently resides.

#### 2.8.9 Partner and Integration Interaction History
The system shall maintain an interaction history for partner and integration activity linked to a transaction.

This shall include, as applicable:

- request timestamp
- response timestamp
- callback timestamp
- route used
- provider status
- response code
- response message
- retry count
- timeout occurrence
- idempotency reference
- fallback route where applicable
- file-based submission reference where applicable

#### 2.8.10 Exceptions, Investigations, and Query Handling
The system shall support operational exception handling and investigation workflows.

Exception handling shall support:

- failed transaction investigation
- stuck transaction review
- unmatched status investigation
- delayed payout review
- duplicate transaction review
- partner rejection review
- customer query linkage
- internal escalation
- case linkage where compliance or fraud involvement is required

The Backoffice shall allow authorised users to record investigation notes, assign ownership, set follow-up tasks, and track resolution status.

#### 2.8.11 Reservations and Funds Control
Where the product model requires reservation or earmarking of funds prior to execution, the system shall support reservation controls.

This shall include:

- fund reservation creation
- reserved amount visibility
- release of reservation
- reservation expiry
- conversion of reservation into executed transaction
- reservation failure handling
- linkage to account balance and ledger entries

The system shall prevent double-use of reserved funds.

#### 2.8.12 Bulk and File-Based Operations
Where enabled, the system shall support bulk or file-based payment operations.

This may include:

- file upload
- file validation
- file-level approval
- transaction creation from file
- batch status monitoring
- error reporting by line item
- batch cancellation where permitted
- export of processing results

The system shall maintain traceability between file, batch, and underlying transactions.

#### 2.8.13 Search, Register, and Operational Queues
The system shall provide transaction registers, advanced search, and operational queues.

Authorised users shall be able to search and filter by:

- transaction reference
- customer
- beneficiary
- transaction type
- product
- corridor
- currency
- amount
- funding method
- payout method
- status
- queue
- partner
- date range
- exception flag
- approval status

Operational queues may include:

- pending review
- pending approval
- awaiting funds
- pending screening
- pending payout submission
- failed transactions
- refunds pending
- investigations open

#### 2.8.14 Linked Records and Full Transaction View
The system shall provide a comprehensive transaction view combining linked operational and financial data.

This shall include, as applicable:

- customer and account details
- beneficiary details
- quote details
- pricing details
- validation outcomes
- screening outcomes
- approval history
- funding events
- payout events
- integration history
- ledger postings
- settlement references
- reconciliation status
- notes, tasks, and case links
- audit history

#### 2.8.15 Audit and Reporting
The system shall maintain a full audit trail for transaction operations and servicing actions.

The audit trail shall capture:

- transaction reference
- action taken
- field changed where applicable
- old value and new value
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

The system shall provide reporting on:

- transaction volumes
- transaction values
- transactions by type
- transactions by status
- failed transactions
- refunds and reversals
- average processing times
- queue ageing
- partner performance
- operational exception trends

---

### 2.9 Treasury, Safeguarding, and Nostro Management

The Backoffice shall support treasury control, safeguarding oversight, funding account visibility, partner prefunding, liquidity monitoring, and reconciliation-oriented management of nostro and related operational accounts.

The treasury model shall support both tenant operational treasury activity and platform-level visibility where contractually and operationally permitted.

#### 2.9.1 Treasury Account Registry
The system shall maintain a registry of treasury-relevant accounts, including:

- safeguarding accounts
- operating accounts
- settlement accounts
- nostro accounts
- partner prefunding accounts
- collection accounts
- suspense or exception accounts where applicable

Each account record shall include, as applicable:

- account reference
- account type
- account owner
- bank or provider name
- currency
- country
- account identifier or masked number
- status
- account purpose
- linked tenant
- linked integration
- balance source
- notes

#### 2.9.2 Liquidity Visibility
The system shall provide authorised users with visibility of available liquidity relevant to transaction and treasury operations.

Liquidity visibility shall support:

- current balance by treasury account
- available balance
- pending inflows
- pending outflows
- expected settlement obligations
- prefunding availability
- currency-level liquidity view
- provider-level liquidity view
- intraday and end-of-day position view

The system shall support both real-time and file-based or periodic balance updates depending on the integration model.

#### 2.9.3 Partner Prefunding Management
Where payout or banking partners operate on a prefunded model, the system shall support tracking and control of partner prefunding positions.

This shall include:

- partner prefunding account or wallet reference
- partner name
- currency
- funded balance
- available balance
- reserved amount
- minimum threshold
- warning threshold
- target top-up level
- pending top-up amount
- pending settlement amount
- last funding timestamp
- notes and exception flags

The Backoffice shall support visibility of prefunding sufficiency against current and expected transaction demand.

#### 2.9.4 Safeguarding Account Visibility
The system shall provide controlled visibility of safeguarding arrangements relevant to customer funds.

Safeguarding visibility shall support:

- safeguarding account list
- currency held
- balance view
- linked product types
- linked customer fund pools where applicable
- date and time of balance update
- pending safeguarding transfer items
- unresolved safeguarding exceptions
- required vs actual safeguarded position
- safeguarding surplus or shortfall indicators

The system shall support reporting suitable for operational safeguarding review.

#### 2.9.5 Safeguarding Calculation and Oversight
The system shall support calculation and review of safeguarded fund positions based on configured business rules.

The system shall support, as applicable:

- customer-funds-in-scope identification
- excluded funds identification
- safeguarding basis by product
- balance aggregation logic
- pending item treatment rules
- required safeguard amount
- actual safeguarded amount
- surplus or deficit calculation
- review date and time
- override notes where applicable

Where final safeguarding calculation is performed externally, the Backoffice shall still support storage, review, and exception management of imported safeguarding results.

#### 2.9.6 Nostro Account Management
The system shall support management and monitoring of nostro accounts used for settlement, payout, or currency operations.

For each nostro account, the system shall support visibility of:

- bank or partner
- account currency
- account country
- account status
- current balance
- value date balance where available
- inbound statement records
- outbound statement records
- pending items
- unmatched statement lines
- linked transactions
- linked settlements
- operational notes

The system shall support viewing nostro statements and transaction history for authorised users.

#### 2.9.7 Treasury Alerts and Thresholds
The system shall allow authorised users to configure and monitor treasury alerts and threshold events.

Alerts may include:

- low liquidity
- low prefunding balance
- safeguarding shortfall
- failed treasury transfer
- delayed statement receipt
- large-value movement alert
- unexpected balance movement
- threshold breach by currency
- threshold breach by partner
- unresolved exception ageing

The system shall support alert ownership, acknowledgement, escalation, and resolution tracking.

#### 2.9.8 Treasury Transfers and Internal Movements
Where operationally supported, the system shall provide visibility of treasury transfers and internal funding movements.

This may include:

- movement between treasury accounts
- top-up of partner prefunding accounts
- safeguarding transfers
- release from safeguarding where applicable
- funding of payout routes
- internal rebalancing across currencies or accounts

The Backoffice shall record:

- transfer reference
- transfer type
- source account
- destination account
- amount
- currency
- status
- initiation date and time
- completion date and time
- user or source process
- approval details where applicable

#### 2.9.9 Settlement Position Visibility
The system shall provide visibility of settlement positions relevant to treasury operations.

Settlement visibility shall support:

- amount due to partner
- amount due from partner
- settlement cycle
- value date
- settlement currency
- settlement status
- settled amount
- outstanding amount
- disputed amount
- linked transactions
- linked reconciliation items

The system shall support both transaction-level and aggregated settlement views.

#### 2.9.10 Reconciliation-Oriented Treasury Visibility
The treasury area shall provide operational visibility of reconciliation-relevant treasury items.

This shall include:

- unmatched bank statement lines
- unmatched nostro entries
- unmatched safeguarding entries
- partner prefunding mismatches
- duplicate treasury movements
- stale pending items
- value-date mismatches
- unresolved settlement breaks

The Backoffice shall support linkage of such items to reconciliation workflows and exception handling processes.

#### 2.9.11 Operational Notes, Tasks, and Escalations
The system shall allow authorised users to maintain treasury-related notes, reminders, tasks, and escalation records.

This shall support:

- liquidity follow-up task
- prefunding top-up task
- safeguarding review reminder
- bank statement follow-up
- reconciliation escalation
- partner settlement escalation
- issue ownership
- due date
- resolution notes

#### 2.9.12 Search, Register, and Reporting
The system shall provide searchable registers and reports across treasury, safeguarding, and nostro records.

Authorised users shall be able to search and filter by:

- treasury account
- account type
- partner
- bank
- currency
- country
- balance status
- prefunding status
- safeguarding status
- settlement status
- exception flag
- date range

The system shall provide reporting on:

- liquidity by currency
- liquidity by partner
- prefunding sufficiency
- safeguarding position
- safeguarding surplus or shortfall
- nostro balances
- treasury transfers
- outstanding settlement positions
- treasury exceptions
- threshold breaches

#### 2.9.13 Audit and Traceability
The system shall maintain a full audit trail for treasury, safeguarding, and nostro management activities.

The audit trail shall capture:

- record affected
- field changed or action taken
- old value and new value where applicable
- user making the change
- date and time
- reason for change or action where applicable
- approval details where applicable

The system shall support evidence extraction for internal review, audit, finance control, and regulatory reporting.

### 2.10 AML / CTF / Fraud and Case Management

The Backoffice shall support AML, CTF, sanctions, PEP, adverse media, fraud, and transaction monitoring operations through a controlled workflow for alert generation, review, investigation, escalation, decisioning, and case management.

The control framework shall support customer-level, account-level, beneficiary-level, and transaction-level monitoring.

#### 2.10.1 Screening and Monitoring Scope
The system shall support screening and monitoring across the following operational objects, as applicable:

- individual customers
- business customers
- customer users
- directors, shareholders, and UBOs
- beneficiaries and counterparties
- wallets and accounts
- virtual account activity
- transactions
- funding events
- withdrawals
- internal operational movements where relevant

The exact control scope may vary by product, tenant, jurisdiction, and regulatory model.

#### 2.10.2 Screening Types
The system shall support, directly or through integrated providers, the following screening types:

- sanctions screening
- PEP screening
- adverse media screening
- internal watchlist screening
- blacklist screening
- country risk screening
- counterparty screening
- beneficiary screening
- transaction screening

The system shall support initial screening, periodic rescreening, event-triggered rescreening, and manual rescreening.

#### 2.10.3 Monitoring Rules and Alert Generation
The system shall support generation of AML, CTF, fraud, or risk alerts based on configured business and compliance rules.

Alert generation may be based on:

- high-value transactions
- unusual transaction frequency
- corridor risk
- customer-risk mismatch
- rapid movement of funds
- dormant account reactivation with unusual activity
- unusual FX conversion behaviour
- structuring patterns
- unusual funding source behaviour
- repeated failed transactions
- beneficiary risk triggers
- sanctions or screening matches
- rule breaches from internal watchlists
- manual referral by authorised user

The system shall support both real-time and batch alert generation models.

#### 2.10.4 Alert Register and Search
The system shall provide an alert register for authorised users.

Authorised users shall be able to search and filter alerts by:

- alert reference
- alert type
- linked customer
- linked beneficiary
- linked transaction
- linked account
- screening type
- severity
- risk level
- status
- owner
- creation date
- ageing
- tenant
- source system or provider

The alert register shall support prioritisation and queue-based working.

#### 2.10.5 Alert Review Workflow
The system shall support review of generated alerts through a defined workflow.

The alert review workflow shall support:

- new alert
- assigned
- under review
- awaiting information
- escalated
- referred to case
- cleared
- closed

The system shall allow authorised users to:

- open and review alert details
- record analysis notes
- request additional information
- assign ownership
- change review status
- escalate for further review
- link the alert to a case
- clear or close the alert with reason

#### 2.10.6 Screening Match Review
Where screening providers return potential matches, the system shall allow authorised users to review match details.

The system shall support visibility of:

- match source
- match score where available
- matched name or attribute
- matched list type
- country or jurisdiction context
- provider comments where available
- historical screening outcomes
- previous review actions

The system shall support recording of:

- false positive outcome
- potential match outcome
- confirmed match outcome
- escalated outcome
- rescreening instruction
- review rationale

#### 2.10.7 Case Management
The system shall support creation and management of compliance, fraud, and investigation cases.

A case may be created from one or more alerts, transactions, customers, beneficiaries, or manual referrals.

Each case record shall support:

- case reference
- case type
- linked alert references
- linked customer or entity
- linked transaction references
- linked beneficiary references
- linked accounts
- severity
- priority
- owner
- assigned team
- status
- creation date
- target review date
- escalation status
- closure date
- closure reason
- case notes
- document attachments

#### 2.10.8 Case Workflow and Ownership
The system shall support controlled case workflow states, which may include:

- open
- assigned
- under investigation
- awaiting information
- escalated
- pending decision
- reported externally
- closed
- archived

The system shall support:

- assignment to individual user or team
- reassignment
- internal escalation
- management review
- linked task management
- target date tracking
- overdue case visibility

#### 2.10.9 Decisioning and Control Actions
The system shall allow authorised users, subject to permissions and controls, to record case or alert decisions and apply relevant operational actions.

Decision options may include:

- clear
- refer
- escalate
- restrict account
- freeze account
- hold transaction
- reject transaction
- block beneficiary
- request enhanced due diligence
- require further information
- exit customer relationship
- prepare internal report
- prepare external report

The system shall ensure that control actions are reflected in the linked operational records where applicable.

#### 2.10.10 SAR / STR and Regulatory Reporting Support
The system shall support preparation and recordkeeping of suspicious activity or suspicious transaction reporting processes.

This shall include, as applicable:

- internal suspicious activity report
- external suspicious activity or suspicious transaction report
- case linkage
- date of suspicion
- reporting decision
- reporting status
- reference number
- reporting jurisdiction
- submission notes
- supporting evidence
- restricted visibility controls

The system may support export or integration for external filing where required.

#### 2.10.11 Fraud Review Support
The system shall support fraud operations in addition to AML / CTF controls where configured.

Fraud-related support may include:

- suspicious login event review
- account takeover suspicion review
- unusual device or access pattern review
- rapid funding and withdrawal review
- unusual beneficiary behaviour
- repeated payment failure review
- chargeback or funding dispute linkage where applicable
- customer impersonation investigation
- internal fraud referral

Fraud alerts and cases may share the same case management framework or operate as a distinct case category.

#### 2.10.12 Review Notes, Tasks, and Evidence
The system shall allow authorised users to add and manage review notes, tasks, and evidence linked to alerts and cases.

This shall support:

- analyst notes
- supervisory notes
- evidence attachments
- linked documents
- internal task assignment
- due date
- completion status
- restricted note visibility where applicable

The system shall preserve authorship, timestamp, and edit history where applicable.

#### 2.10.13 Periodic Review and Ongoing Monitoring Support
The system shall support periodic review controls for customers, business entities, accounts, and related parties.

Periodic review support shall include:

- review due date
- risk-based review cycle
- reminder generation
- outstanding review register
- document refresh requirement
- rescreening requirement
- linked task generation
- overdue review reporting

#### 2.10.14 Search, Reporting, and MI
The system shall provide reporting and MI for AML, CTF, fraud, and case operations.

The system shall support reporting on:

- alerts by type
- alerts by status
- alerts by severity
- cases by type
- cases by status
- ageing of alerts and cases
- false positive rates
- confirmed match outcomes
- SAR / STR activity
- restriction actions applied
- overdue reviews
- monitoring trends by corridor, product, customer type, or risk category

#### 2.10.15 Audit and Traceability
The system shall maintain a full audit trail for AML, CTF, fraud, and case management activities.

The audit trail shall capture:

- alert or case reference
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

The system shall support evidence extraction for compliance review, internal audit, external audit, and regulatory inspection.

---

### 2.11 Document and Communication Management

The Backoffice shall support secure storage, retrieval, classification, review, and controlled communication handling for documents and messages linked to customers, customer users, beneficiaries, transactions, cases, and commercial records where applicable.

The system shall support operational, compliance, servicing, and audit use cases for both documents and communications.

#### 2.11.1 Document Registry
The system shall maintain a document registry for all relevant documents stored or referenced within the suite.

The document registry shall support documents linked to:

- individual customers
- business customers
- customer users
- directors, shareholders, and UBOs
- beneficiaries and counterparties
- wallets and accounts
- virtual accounts
- transactions
- alerts and cases
- commercial customer records where permitted

The registry shall support active, inactive, expired, rejected, archived, and deleted-record states as applicable to retention rules.

#### 2.11.2 Document Types and Classification
The system shall support controlled document type management.

Document types may include, as applicable:

- identity document
- proof of address
- incorporation certificate
- shareholder register
- UBO declaration
- bank statement
- source of funds evidence
- source of wealth evidence
- transaction supporting document
- compliance evidence
- legal agreement
- internal review memo
- commercial contract
- other configured document category

The system shall support document classification by:

- document type
- linked entity type
- issuing country
- issue date
- expiry date
- verification status
- confidentiality level
- retention category

#### 2.11.3 Document Upload and Ingestion
The system shall support document upload and ingestion through user-facing channels, API channels, internal Backoffice actions, and integrated processes where applicable.

The system shall support:

- manual upload
- drag-and-drop upload where applicable
- multi-file upload
- channel source identification
- document metadata capture
- virus or file safety checks where configured
- file-format validation
- duplicate detection support where applicable

The system shall record upload source, upload date and time, and the user or process responsible.

#### 2.11.4 Document Review and Verification
The system shall allow authorised users to review and verify uploaded or linked documents.

Document review support shall include:

- view document
- zoom or inspect where supported
- compare with customer data
- approve
- reject
- mark pending information
- request replacement
- record review notes
- assign reviewer
- set review status
- record verification date

The system shall support maker-checker controls for sensitive document decisions where configured.

#### 2.11.5 Document Status and Expiry Management
The system shall support document lifecycle statuses, which may include:

- uploaded
- pending review
- verified
- rejected
- expired
- superseded
- archived

The system shall support:

- expiry date tracking
- reminder generation prior to expiry
- overdue document reporting
- linkage to onboarding or review workflows
- prevention or restriction rules where mandatory documents are missing or expired

#### 2.11.6 Secure Storage and Retrieval
The system shall support secure storage and controlled retrieval of documents.

The document management framework shall support:

- permission-controlled access
- restricted visibility by role or case type
- secure object storage or equivalent
- metadata indexing
- masked or limited preview rules where required
- document download permissions
- audit of document access
- retention and archival controls

#### 2.11.7 Communication Channels
The system shall support operational communication through one or more channels, including:

- email
- SMS
- push notification
- in-app messaging
- internal Backoffice notes or messages
- system-generated notifications

The exact channels available may depend on tenant configuration, product model, and integration setup.

#### 2.11.8 Message Templates
The system shall support creation and maintenance of message templates for operational and customer communication.

Template management shall support:

- template name
- channel
- language
- event trigger
- subject line where applicable
- message body
- merge fields
- branding variables
- active or inactive status
- effective date
- approval status where required

The system shall support version history for templates.

#### 2.11.9 Communication History
The system shall maintain a communication history linked to relevant records.

Communication history may include:

- sent email
- received email where integrated
- sent SMS
- push notification
- in-app message
- onboarding request
- document request
- security notification
- transaction notification
- servicing communication

The system shall store, as applicable:

- communication reference
- linked entity
- channel
- sender
- recipient
- subject
- message timestamp
- delivery status
- read status where technically available
- failure reason where applicable

#### 2.11.10 Inbound and Outbound Message Handling
Where supported by integration design, the system shall provide controlled visibility of inbound and outbound customer communications.

This may include:

- incoming message queue
- outgoing message queue
- message status
- undelivered messages
- bounced emails
- failed SMS delivery
- message retry status
- read or opened status where available
- attachment linkage where permitted

The system shall allow authorised users to review message details and linked records.

#### 2.11.11 Document and Communication Requests
The system shall support generation and tracking of requests sent to customers or counterparties for documents or information.

This shall include:

- request type
- request reason
- request date
- due date
- linked customer or case
- requested document types
- message sent
- response received
- request status
- overdue status
- follow-up reminders

The system shall support request generation from onboarding, periodic review, and case workflows.

#### 2.11.12 Operational Notes and Internal Messaging
The system shall support internal notes and, where configured, internal messaging linked to operational records.

This shall support:

- servicing notes
- compliance notes
- finance notes
- implementation notes
- task-linked notes
- restricted internal notes
- note authorship
- timestamp
- edit history where applicable

#### 2.11.13 Search, Register, and Reporting
The system shall provide searchable registers and reporting across document and communication records.

Authorised users shall be able to search and filter by:

- document type
- linked customer
- linked transaction
- linked case
- expiry date
- verification status
- communication channel
- recipient
- delivery status
- request status
- upload date
- created date
- tenant

The system shall provide reporting on:

- pending document reviews
- expired documents
- overdue document requests
- documents by type
- communication delivery performance
- bounced or failed messages
- unread or unresolved inbound messages where applicable
- document and message activity trends

#### 2.11.14 Audit and Traceability
The system shall maintain a full audit trail for document and communication management activities.

The audit trail shall capture:

- document or communication reference
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

The system shall also log material access to restricted documents and sensitive communications.

### 2.12 Accounting and Ledger Management

The Backoffice shall support accounting visibility, internal ledger operations, journal-based financial recordkeeping, and controlled posting, review, and reporting of financial events arising from wallet, account, FX, payment, treasury, safeguarding, settlement, and operational activities.

The accounting and ledger model shall support financial control, traceability, reconciliation, and reporting, while preserving immutability of material financial postings.

#### 2.12.1 Ledger Framework
The system shall maintain an internal ledger framework to record financial events generated by the platform.

The ledger framework shall support, as applicable:

- customer balance movements
- wallet balance movements
- account funding events
- account withdrawal events
- payment and remittance execution
- FX conversion postings
- fee postings
- commission postings
- safeguarding movements
- treasury movements
- settlement movements
- refund and reversal postings
- suspense or exception postings
- adjustment postings under controlled process

The system shall support double-entry or equivalent journal-based accounting principles.

#### 2.12.2 Chart of Accounts and Mapping
The system shall support a chart of accounts and controlled mapping of product and operational events to accounting outcomes.

The chart of accounts framework shall support:

- account code
- account name
- account category
- account type
- currency handling rule
- status
- tenant applicability where relevant
- description
- reporting mapping
- effective date
- retirement date where applicable

The system shall support configurable mapping between business events and ledger accounts.

#### 2.12.3 Journal Entries
The system shall record journal entries for financial events.

Each journal entry shall include, as applicable:

- journal reference
- posting date
- value date
- source event type
- source event reference
- debit account
- credit account
- amount
- currency
- exchange rate where relevant
- description or narrative
- posting status
- tenant
- user or system source
- related transaction, account, or settlement reference

The system shall support multi-line journal entries where required.

#### 2.12.4 Immutability and Adjustment Controls
The system shall preserve immutability of posted financial records.

The system shall not permit direct deletion or silent overwrite of posted journal entries.

Where correction is required, the system shall support controlled mechanisms such as:

- reversal entry
- compensating entry
- adjusting entry
- reclassification entry

All such actions shall be fully audit logged and subject to approval controls where required.

#### 2.12.5 Operational and Financial Posting Linkage
The Backoffice shall maintain linkage between operational events and their associated financial postings.

Authorised users shall be able to review the relationship between:

- customer transaction and journal
- funding event and journal
- FX conversion and journal
- fee calculation and income posting
- commission obligation and payable posting
- treasury movement and journal
- settlement event and journal
- reconciliation exception and suspense posting

#### 2.12.6 Deal Accounts and Product-Level Accounting Views
The system shall support deal-account or product-level accounting views where required by the operating model.

This may include:

- FX deal accounting view
- product-level P&L attribution
- fee income view
- commission payable view
- corridor-level revenue view
- partner-level accounting view
- customer-level balance accounting view where appropriate

#### 2.12.7 Manual Book Entries
Where operationally permitted, the system shall allow authorised users to create manual book entries or accounting adjustments.

Manual entries shall be restricted to authorised users and shall support:

- journal type
- posting date
- value date
- debit account
- credit account
- amount
- currency
- narrative
- linked reason code
- supporting evidence
- preparer
- approver
- approval status

The system shall support maker-checker control for manual financial postings.

#### 2.12.8 Account Balances and Ledger Views
The Backoffice shall provide accounting views of balances and postings.

This shall include, as applicable:

- general ledger balance
- account activity
- journal register
- account movement by date
- balance by currency
- opening and closing balance
- suspense account balance
- safeguarding-related balances
- treasury account accounting view
- unsettled amount view

#### 2.12.9 Fee, Commission, and FX Income Accounting
The system shall support accounting treatment of fee income, commission liabilities, and FX income or cost.

This shall include visibility of:

- fee earned
- fee waived
- fee refunded
- commission payable
- commission settled
- FX gain or income
- FX cost or loss
- rate-based income attribution
- related journal references

#### 2.12.10 Settlement and Reconciliation Linkage
The accounting and ledger module shall support linkage to settlement and reconciliation processes.

This shall include visibility of:

- unsettled postings
- settlement-cleared postings
- reconciliation status
- exception status
- suspense treatment
- aged unmatched items
- value-date mismatches
- partner settlement references
- bank statement references

#### 2.12.11 Period-End and Reporting Support
The system shall support accounting review and reporting for period-end processes.

This may include:

- daily summary view
- month-end reporting view
- trial-balance-style output
- balance sheet support view
- P&L support view where relevant
- fee income report
- FX income report
- commission liability report
- suspense and exception report
- safeguarding support report

The system is not required to replace a full enterprise ERP unless explicitly configured to do so, but it shall provide accounting-grade records and exports.

#### 2.12.12 Search, Register, and Reporting
The system shall provide searchable registers and reporting for accounting and ledger records.

Authorised users shall be able to search and filter by:

- journal reference
- source event reference
- account code
- account name
- posting date
- value date
- currency
- amount
- transaction reference
- customer reference
- partner reference
- posting status
- tenant

The system shall provide reporting on:

- journal volumes
- balances by account
- balances by currency
- manual postings
- reversals and adjustments
- suspense balances
- fee income
- FX income
- commission liabilities
- unsettled accounting positions

#### 2.12.13 Audit and Traceability
The system shall maintain a full audit trail for accounting and ledger activities.

The audit trail shall capture:

- journal or ledger record affected
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

The system shall support traceability from operational event to financial posting, and from financial posting to reporting output.

### 2.13 Integration Management

The Backoffice shall support controlled administration, configuration visibility, operational monitoring, and exception handling for integrations used by the Pangea Pay suite.

The integration management framework shall support integrations required for customer onboarding, payments, wallet and account services, virtual accounts, treasury, safeguarding, notifications, compliance, reporting, and commercial delivery.

#### 2.13.1 Integration Registry
The system shall maintain a central integration registry for all configured internal and third-party integrations.

Each integration record shall include, as applicable:

- integration reference
- integration name
- integration type
- provider name
- purpose
- supported application or module
- supported tenant or environment
- connectivity method
- authentication method
- status
- owner or support contact
- escalation contact
- notes

The system shall support classification of integrations by category, including:

- banking partner
- payment gateway
- payout partner
- virtual account provider
- KYC or identity provider
- screening provider
- messaging provider
- treasury or statement provider
- open banking provider
- authentication provider
- file exchange integration
- internal platform integration

#### 2.13.2 Environment and Tenant Scope
The system shall support integration visibility and configuration by environment and tenant.

The integration management model shall support:

- shared platform integration
- tenant-specific integration
- production environment integration
- non-production environment integration
- regional integration variant
- white-label or customer-specific integration model

The system shall ensure that authorised users can only view or manage integration records within their permitted scope.

#### 2.13.3 Configuration Parameter Management
The system shall support controlled management of technical and business parameters used by integrations.

Configuration parameter management shall support, as applicable:

- endpoint reference
- route identifier
- provider account or merchant identifier
- product mapping
- currency mapping
- country mapping
- payout method mapping
- timeout value
- retry rule
- callback endpoint reference
- file naming rule
- cut-off time
- processing window
- rate limit setting
- failover priority
- operational flag
- activation status

Sensitive credentials and secrets shall be managed through secure secret-handling mechanisms and shall not be visible in plain text to normal administrative users.

#### 2.13.4 Credential and Secret Reference Handling
The system shall support secure reference-based handling of credentials used by integrations.

This shall support, as applicable:

- API key reference
- client ID reference
- certificate reference
- token reference
- secret version reference
- expiry date
- credential status
- rotation date
- owner

The system shall support recording of secret metadata without exposing secret values in the Backoffice.

#### 2.13.5 Mapping and Translation Rules
The system shall support mapping and translation rules used to connect internal platform objects to provider-specific formats.

Mapping and translation rules may include:

- transaction status mapping
- customer status mapping
- country and currency mapping
- document type mapping
- payout method mapping
- error code mapping
- screening result mapping
- bank or route code mapping
- provider response interpretation rules

The system shall retain version history of mapping changes where materially relevant to operational processing.

#### 2.13.6 Route and Provider Prioritisation
The system shall support route selection and provider prioritisation rules where more than one integration path is available.

This shall support:

- primary route
- fallback route
- route priority ranking
- corridor-specific routing
- payout-method-specific routing
- currency-specific routing
- tenant-specific routing
- cost-based routing where configured
- availability-based routing where configured
- emergency route disablement

The Backoffice shall provide visibility of the currently configured route order and route eligibility.

#### 2.13.7 Connectivity and Health Monitoring
The system shall support monitoring of integration connectivity and operational health.

Health monitoring shall include, as applicable:

- connectivity status
- service availability
- callback availability
- file receipt status
- file dispatch status
- last successful request timestamp
- last failed request timestamp
- latency indicator where available
- authentication failure indicator
- degraded service flag
- maintenance status

The system shall provide a dashboard or equivalent view of integration status for authorised users.

#### 2.13.8 Request, Response, and Callback Logging
The system shall maintain controlled logs of integration interactions.

Logging shall support, as applicable:

- request timestamp
- response timestamp
- callback timestamp
- integration reference
- operation type
- route used
- status outcome
- provider response code
- provider response message
- retry count
- timeout occurrence
- idempotency reference
- correlation reference
- linked customer or transaction reference where applicable

The system shall apply masking, redaction, or controlled visibility rules for sensitive data in logs.

#### 2.13.9 File-Based Integration Management
Where applicable, the system shall support monitoring and control of file-based integrations.

This shall support:

- inbound file register
- outbound file register
- file reference
- file type
- source or destination
- file status
- validation status
- processing status
- line-item error count
- received date and time
- sent date and time
- linked batch or transaction references

The system shall support investigation of failed or partially processed files.

#### 2.13.10 Exception Handling and Retry Control
The system shall support integration exception visibility and controlled retry management.

This shall include visibility of:

- failed requests
- timed-out requests
- failed callbacks
- invalid responses
- authentication failures
- file validation failures
- mapping failures
- route unavailability
- reconciliation-impacting integration failures

Where operationally appropriate, the system shall support:

- manual retry
- controlled requeue
- route switch
- exception acknowledgement
- escalation
- follow-up task assignment

#### 2.13.11 Change Control and Approval
The system shall support controlled change management for integration configuration.

The change control framework shall support:

- creation of new integration records
- configuration updates
- activation or deactivation
- route reprioritisation
- parameter change
- mapping change
- credential reference update
- environment rollout
- production release approval where required

The system shall support maker-checker approval for material production changes where configured.

#### 2.13.12 Operational Notes and Support Ownership
The system shall allow authorised users to record operational notes and support ownership details for integrations.

This shall support:

- internal owner
- vendor or provider contact
- escalation path
- support SLA reference
- maintenance notes
- known issue notes
- workaround notes
- temporary operational instruction
- last review date

#### 2.13.13 Search, Register, and Reporting
The system shall provide searchable registers and reporting across integration records and operational events.

Authorised users shall be able to search and filter by:

- integration name
- provider
- integration type
- application or module
- tenant
- environment
- status
- route type
- exception status
- health status
- last activity date
- operation type

The system shall provide reporting on:

- active integrations
- integrations by type
- integration health status
- failed requests
- callback failures
- file-processing failures
- exception ageing
- retry volumes
- route utilisation
- provider availability trends

#### 2.13.14 Audit and Traceability
The system shall maintain a full audit trail for integration management activity.

The audit trail shall capture:

- integration or configuration record affected
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for change where applicable
- approval details where applicable
- tenant and environment context

The system shall support traceability between integration configuration, operational events, and affected business outcomes where possible.

### 2.14 Reports and Audit

The Backoffice shall provide operational, compliance, treasury, accounting, commercial, and management reporting, together with comprehensive audit visibility across the Pangea Pay suite.

The reporting and audit framework shall support both standard reports and configurable filtering for authorised users, subject to role, tenant, environment, and data-access restrictions.

#### 2.14.1 Reporting Framework
The system shall support a structured reporting framework covering the major functional domains of the platform.

The reporting framework shall include, as applicable:

- customer reports
- onboarding and verification reports
- wallet and account reports
- virtual account reports
- beneficiary and counterparty reports
- payment and transaction reports
- FX and pricing reports
- treasury and liquidity reports
- safeguarding reports
- nostro reports
- settlement and reconciliation reports
- AML / CTF / fraud reports
- document and communication reports
- accounting and ledger reports
- integration reports
- commercial and subscription reports where permitted

#### 2.14.2 Dashboard and MI Views
The system shall support dashboard and management information views for authorised users.

Dashboard views may include:

- transaction volume and value
- active customers
- onboarding pipeline
- alert and case volumes
- account balances by currency
- liquidity position
- prefunding status
- safeguarding position
- failed transaction trends
- integration health indicators
- operational queue ageing
- revenue or fee indicators where permitted

The system shall support role-specific dashboards where configured.

#### 2.14.3 Standard Operational Reports
The system shall provide standard operational reports, which may include:

- customer activity report
- payment report
- transaction status report
- pending review report
- failed transaction report
- refund and reversal report
- beneficiary activity report
- account balance report
- virtual account usage report
- document expiry report
- communication delivery report

The exact report catalogue may vary by tenant, entitlement, and operating model.

#### 2.14.4 Treasury, Safeguarding, and Settlement Reports
The system shall support treasury and control-oriented reporting, including:

- safeguard report
- current account balance report
- liquidity by currency report
- prefunding sufficiency report
- nostro balance report
- treasury movement report
- settlement outstanding report
- reconciliation exception report
- threshold breach report
- aged unresolved treasury exception report

#### 2.14.5 Compliance and Risk Reports
The system shall support compliance and risk reporting, including:

- sanctions and screening outcome report
- alert register report
- case ageing report
- SAR / STR support report
- periodic review due report
- restricted customer report
- blocked beneficiary report
- high-risk customer report
- fraud event report
- control-action report

#### 2.14.6 Accounting and Financial Control Reports
The system shall support accounting and financial-control-oriented reporting, including:

- journal report
- account movement report
- balance summary report
- fee report
- fee income report
- FX income report
- commission liability report
- suspense account report
- unsettled posting report
- balance-sheet-support report
- period-end support report

#### 2.14.7 Configurable Filters and Parameters
The system shall allow authorised users to run reports using configurable filters and parameters.

Supported filters may include:

- tenant
- environment
- date range
- customer type
- customer reference
- product
- corridor
- country
- currency
- payout method
- funding method
- partner
- integration
- status
- risk category
- owner
- ageing band

The system shall validate user permissions before returning report results.

#### 2.14.8 Export and Distribution Controls
The system shall support controlled export and distribution of reports.

Export options may include:

- CSV
- XLSX
- PDF
- structured data extract
- scheduled secure delivery where configured

The system shall support permission-controlled export and may support watermarking, masking, or download restrictions for sensitive reports.

#### 2.14.9 Scheduled Reporting
The system shall support scheduled generation or delivery of selected reports where configured.

Scheduled reporting shall support:

- report template selection
- date and time schedule
- recurrence pattern
- recipient list
- export format
- delivery channel
- permission validation
- report run history
- failed delivery logging

#### 2.14.10 Report Definitions and Versioning
The system shall support controlled maintenance of report definitions.

This shall include, as applicable:

- report name
- report description
- owning function
- data source
- filter set
- output columns
- aggregation logic
- environment applicability
- tenant applicability
- active or inactive status
- version history

Material changes to standard report definitions shall be audit logged.

#### 2.14.11 Data Access Control and Sensitive Information Handling
The reporting framework shall enforce role-based access control and data minimisation principles.

The system shall support, as applicable:

- tenant-scoped visibility
- role-based report access
- field masking
- partial-value display
- restricted export rights
- restricted case-report access
- restricted document-report access
- restricted commercial-report access
- environment-specific access control

The system shall prevent unauthorised access to sensitive or restricted reporting outputs.

#### 2.14.12 Audit Trail Framework
The system shall maintain a platform-wide audit trail of material actions.

Audit records shall be generated for, as applicable:

- creation, update, suspension, activation, and deletion events where permitted
- customer and account servicing actions
- transaction servicing actions
- compliance decisions
- document review actions
- pricing and configuration changes
- integration changes
- manual accounting entries
- report exports
- access to restricted information
- security and authentication events

#### 2.14.13 Audit Search and Investigation Support
The system shall provide authorised users with the ability to search and review audit records.

Audit search shall support filtering by:

- date range
- user
- tenant
- environment
- module
- action type
- linked record reference
- affected customer
- affected transaction
- approval status
- source IP or session reference where captured

The system shall support investigation-friendly visibility of event sequence and linked records.

#### 2.14.14 Report and Audit Retention
The system shall support retention rules for reports, report run history, audit logs, and exported output metadata in accordance with configured business, contractual, and regulatory requirements.

The system shall support:

- retention period by record type
- archive status
- purge eligibility
- legal or investigation hold flag
- restricted deletion controls
- retrieval of archived report and audit metadata where applicable

#### 2.14.15 Evidence Extraction and Regulatory Support
The system shall support extraction of report and audit evidence for internal review, customer servicing, finance control, audit, litigation support, and regulatory inspection.

Evidence extraction support shall include:

- export of filtered audit history
- export of linked record history
- generation of control reports
- generation of exception reports
- production of historical report outputs where retained
- linkage between operational event, approval history, and financial impact where applicable

#### 2.14.16 Audit and Administration of Reporting
The system shall maintain a full audit trail for report-definition changes, report scheduling changes, and material reporting administration actions.

The audit trail shall capture:

- report or audit configuration affected
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

### 2.15 Settlement and Reconciliation Management

The Backoffice shall support settlement oversight, reconciliation processing, exception management, and controlled resolution of breaks between internal platform records and external financial, treasury, banking, partner, and provider records.

The settlement and reconciliation framework shall support transaction-level, batch-level, account-level, partner-level, and ledger-level reconciliation as required by the operating model.

#### 2.15.1 Settlement Record Visibility
The system shall provide authorised users with visibility of settlement obligations and settlement outcomes.

This shall include, as applicable:

- settlement reference
- settlement cycle
- settlement date
- value date
- settlement party
- settlement currency
- gross amount
- net amount
- fee component where applicable
- status
- linked transactions
- linked treasury account
- linked ledger entries
- linked reconciliation status

#### 2.15.2 Reconciliation Sources
The system shall support reconciliation against one or more record sources, including:

- internal transaction records
- internal ledger postings
- bank statements
- nostro statements
- safeguarding records
- partner reports
- payout confirmations
- prefunding balances
- file-based operational records
- settlement files
- API responses or callback status records where relevant

#### 2.15.3 Reconciliation Levels
The reconciliation framework shall support one or more of the following levels as applicable:

- transaction-level reconciliation
- batch-level reconciliation
- account-level reconciliation
- currency-level reconciliation
- partner-level reconciliation
- settlement-cycle reconciliation
- ledger-to-bank reconciliation
- ledger-to-operational-event reconciliation
- safeguarding reconciliation

#### 2.15.4 Matching Logic
The system shall support matching logic based on one or more attributes, including:

- transaction reference
- partner reference
- bank reference
- value date
- amount
- currency
- account reference
- settlement reference
- beneficiary reference where relevant
- status mapping
- file line reference where applicable

The system shall support exact-match and controlled tolerance-based or rule-based matching where configured.

#### 2.15.5 Reconciliation Statuses
The system shall support controlled reconciliation statuses, which may include:

- not reconciled
- partially reconciled
- reconciled
- exception identified
- under investigation
- adjusted
- resolved
- written off where permitted
- archived

The system shall maintain historical status progression for reconciliation items.

#### 2.15.6 Exception and Break Management
The system shall support identification and controlled handling of reconciliation breaks and exceptions.

This may include:

- unmatched internal record
- unmatched external record
- amount mismatch
- currency mismatch
- value-date mismatch
- duplicate item
- missing settlement item
- stale pending item
- status mismatch
- ledger mismatch
- safeguarding mismatch
- partner prefunding mismatch

The system shall allow authorised users to record investigation notes, assign ownership, set target dates, and track resolution status.

#### 2.15.7 Adjustment and Resolution Controls
Where reconciliation exceptions require financial or operational adjustment, the system shall support controlled resolution actions, subject to permission and approval rules.

Resolution actions may include:

- manual matching
- exception acknowledgement
- escalation
- suspense treatment
- corrective posting
- reversal posting
- settlement adjustment
- partner follow-up
- bank follow-up
- write-off where permitted
- carry-forward for later settlement cycle where applicable

All material resolution actions shall be audit logged.

#### 2.15.8 Operational Queues and Registers
The system shall provide searchable reconciliation registers and working queues.

Authorised users shall be able to search and filter by:

- reconciliation reference
- transaction reference
- settlement reference
- partner
- bank
- currency
- amount
- exception type
- status
- owner
- ageing
- date range
- account
- tenant

#### 2.15.9 Reporting and MI
The system shall provide reconciliation and settlement reporting including, as applicable:

- reconciled items
- unreconciled items
- aged breaks
- settlement outstanding
- unresolved exceptions
- safeguarding breaks
- nostro mismatches
- partner-level breaks
- write-offs
- adjustment history
- reconciliation ageing trends

#### 2.15.10 Audit and Traceability
The system shall maintain a full audit trail for settlement and reconciliation activities.

The audit trail shall capture:

- reconciliation or settlement item affected
- action taken
- field changed where applicable
- old value and new value where applicable
- user making the change
- date and time
- reason for action where applicable
- approval details where applicable

The system shall support traceability between transaction, ledger, settlement, treasury, and reconciliation records.

### 2.16 Onboarding and Verification Operations

The Backoffice shall support a dedicated operational workspace for onboarding, verification, and customer review activities performed by operations, compliance, or onboarding teams.

This module shall support high-volume daily processing of pending customer onboarding and review work items.

#### 2.16.1 Onboarding Queue
The system shall provide an onboarding and verification queue for authorised users.

The queue shall include, as applicable:

- pending registration records
- pending onboarding submissions
- pending document review items
- pending verification outcomes
- pending KYC / KYB review items
- pending additional-information responses
- referred or escalated onboarding cases
- overdue review items

#### 2.16.2 Queue Filtering and Search
Authorised users shall be able to search and filter onboarding work items by:

- customer reference
- customer name
- customer type
- registration date
- submission date
- onboarding status
- verification status
- screening outcome
- risk category
- assigned reviewer
- escalation status
- overdue status
- jurisdiction
- product type
- document status

#### 2.16.3 Work Allocation and Assignment
The system shall support assignment and ownership of onboarding work items.

This shall include:

- assign to reviewer
- reassign to another reviewer
- bulk assignment where permitted
- assignment timestamp
- queue ownership visibility
- team-based assignment where configured

#### 2.16.4 SLA and Ageing Visibility
The system shall support tracking of onboarding-processing timeliness.

This shall include:

- queue ageing
- target review time
- overdue indicator
- priority indicator
- pending-customer-action indicator
- pending-internal-review indicator

#### 2.16.5 Integrated Review View
The onboarding operations workspace shall provide visibility of all relevant information required for review, including:

- customer profile summary
- onboarding data submitted
- documents submitted
- verification outcome
- screening outcome
- previous review notes
- additional-information requests
- related alerts or restrictions where applicable

#### 2.16.6 Review Actions
Authorised users shall be able to perform onboarding-related actions including:

- approve onboarding stage
- reject onboarding submission
- request additional information
- refer for enhanced review
- escalate to compliance
- assign follow-up task
- record decision rationale

#### 2.16.7 Audit and Reporting
The system shall maintain a full audit trail for onboarding and verification operations.

The system shall provide reporting on:

- pending onboarding volumes
- onboarding ageing
- approval and rejection rates
- additional-information request volumes
- reviewer productivity
- overdue onboarding items
- escalation trends

### 2.17 Customer Support and Query Management

The Backoffice shall support a dedicated customer-support and service-request management capability for operational, account, transaction, and document-related queries raised by customers, business users, API consumers, or internal teams.

#### 2.17.1 Support Request Register
The system shall provide a register of customer support requests and operational queries.

This may include:

- customer queries
- business-user queries
- transaction-related queries
- account-related queries
- onboarding-related queries
- document-related queries
- complaint or dispute-related queries
- partner or API-consumer operational queries where permitted

#### 2.17.2 Request Record
Each support request or service query record shall include, as applicable:

- request reference
- request type
- source channel
- linked customer
- linked customer user
- linked account
- linked beneficiary
- linked transaction
- linked case where applicable
- priority
- status
- owner
- date created
- target response date
- resolution date
- notes
- attachments where applicable

#### 2.17.3 Queue, Search, and Filtering
Authorised users shall be able to search and filter support requests by:

- request reference
- customer
- request type
- status
- priority
- owner
- date range
- linked transaction
- linked account
- linked case
- overdue status
- escalation status

#### 2.17.4 Assignment and Ownership
The system shall support assignment and management of support requests.

This shall include:

- assign to agent
- reassign
- team ownership
- escalation
- internal note entry
- status update
- SLA tracking
- overdue indicators

#### 2.17.5 Communication and Threading
Where supported, the system shall maintain communication history linked to the support request.

This may include:

- inbound customer message
- outbound customer response
- internal note
- follow-up request
- attachment linkage
- communication timestamp
- communication owner

#### 2.17.6 Resolution and Closure
The system shall support controlled closure of support requests.

Closure handling shall include:

- resolution summary
- resolution type
- linked operational action where applicable
- customer response sent where applicable
- closure date and time
- closure owner

#### 2.17.7 Audit and Reporting
The system shall maintain a full audit trail for support and query management actions.

The system shall provide reporting on:

- open queries
- overdue queries
- query volumes by type
- average resolution time
- escalated queries
- complaint trends
- support workload by owner

## 3. Pangea Web App

The Pangea Web App shall provide a secure customer-facing digital channel for retail customers and, where enabled, business customers.

The Web App shall support customer onboarding, wallet and account access, virtual account visibility, beneficiary management, FX and payment journeys, transaction tracking, document access, profile servicing, and security controls, subject to product configuration, tenant entitlement, customer type, and applicable regulatory requirements.

### 3.1 Customer Registration and Access Initiation

The Web App shall allow eligible users to begin access to the platform through a controlled registration and account-access process.

#### 3.1.1 Registration Eligibility
The system shall support customer registration for:

- individual customers
- business customers
- invited business customer users where applicable
- white-label customer channels where configured

The system shall enforce registration eligibility based on:

- country or jurisdiction
- customer type
- tenant entitlement
- product availability
- corridor restrictions
- age or residency rules where applicable

#### 3.1.2 Registration Data Capture
The system shall support capture of registration details required to create an initial customer profile or access request.

For individual customers, registration data may include:

- first name
- last name
- email address
- mobile number
- country of residence
- nationality where required
- date of birth where required
- password or credential creation
- acceptance of terms and conditions
- acceptance of privacy notice
- marketing preference where applicable

For business customers, the system may support capture of:

- business name
- trading name where applicable
- registration number where applicable
- incorporation country
- business contact email
- business contact phone number
- primary authorised representative details
- password or credential creation
- acceptance of terms and conditions
- acceptance of privacy notice

#### 3.1.3 Registration Verification
The system shall support verification of customer contact details during registration.

Verification methods may include:

- email OTP or verification link
- SMS OTP
- combined email and mobile verification
- invitation-token verification for invited business users

The system shall prevent full account activation until required verification steps are completed.

#### 3.1.4 Terms, Consents, and Declarations
The system shall record customer acceptance of required legal and operational declarations.

This may include:

- terms and conditions
- privacy notice
- cookie consent where applicable
- electronic communication consent
- product-specific declarations
- customer eligibility declarations
- regulatory disclosures
- marketing consent or opt-out

The system shall maintain a timestamped record of the version accepted by the customer.

#### 3.1.5 Invited Access for Business Customer Users
Where business customer functionality is enabled, the system shall support invitation-based access for additional customer users.

The invitation model shall support:

- invitation by authorised business owner or administrator where permitted
- invitation by Backoffice-assisted process where applicable
- invitation token or link
- expiry date for invitation
- role or permission assignment
- resend invitation
- invitation withdrawal before acceptance

#### 3.1.6 Registration Status Handling
The system shall support registration and pre-onboarding statuses, which may include:

- started
- pending verification
- pending onboarding
- pending additional information
- active
- suspended
- rejected
- closed

The Web App shall present status-appropriate messaging to the customer.

### 3.2 Identity Verification and Onboarding

The Web App shall support onboarding journeys for KYC, KYB, and related identity and eligibility verification processes.

#### 3.2.1 Onboarding Journey Types
The system shall support onboarding journeys for:

- individual customers
- business customers
- authorised business representatives
- invited business customer users where identity verification is required

The exact onboarding workflow may vary by customer type, product, country, and risk model.

#### 3.2.2 Individual Customer Onboarding
For individual customers, the Web App shall support collection of onboarding information, which may include:

- full legal name
- residential address
- date of birth
- nationality
- country of residence
- occupation
- source of funds information
- tax residency where applicable
- intended product usage
- expected transaction behaviour where required
- identity document information
- proof of address information

#### 3.2.3 Business Customer Onboarding
For business customers, the Web App shall support collection of business onboarding information, which may include:

- legal entity name
- trading name
- business registration number
- incorporation country
- registered address
- operating address
- nature of business
- industry sector
- ownership structure
- authorised representative information
- director details where required
- shareholder details where required
- UBO details where required
- source of funds / source of wealth information where required
- expected payment activity where required

#### 3.2.4 Document Upload During Onboarding
The system shall support upload of required onboarding documents.

This may include:

- passport
- driving licence
- national ID card
- proof of address
- incorporation certificate
- shareholder register
- UBO declaration
- bank statement
- proof of source of funds
- other tenant-configured document types

The system shall validate supported file types, file size, and mandatory document requirements.

#### 3.2.5 Onboarding Review Status Visibility
The Web App shall provide customers with visibility of their onboarding status.

Status visibility may include:

- not started
- in progress
- submitted
- under review
- additional information required
- approved
- rejected
- restricted

The system shall provide clear customer messaging describing next steps where appropriate.

#### 3.2.6 Additional Information Requests
The system shall support requests for additional information during onboarding or subsequent review.

The Web App shall allow customers to:

- view the request
- understand the reason or category of request where appropriate
- upload additional documents
- correct or complete required data
- submit requested information
- view request due date where applicable

#### 3.2.7 Saved Progress and Resume
The system shall allow customers to save onboarding progress and resume later, subject to security and session rules.

The system shall support:

- draft save
- partial completion
- reminder to return to incomplete onboarding
- expiry or timeout of incomplete onboarding where configured

### 3.3 Wallet and Current Account Access

The Web App shall allow eligible customers to access, view, and manage their wallets and current accounts, subject to product and permission configuration.

#### 3.3.1 Account Dashboard
The system shall provide an account dashboard showing key account information.

The dashboard may include:

- available wallets or accounts
- account status
- available balance
- reserved balance where applicable
- blocked balance where applicable
- recent activity
- shortcuts to key actions
- alerts and notifications
- onboarding or review reminders
- pending tasks

#### 3.3.2 Account List and Account Detail View
The system shall allow customers to view their wallets or accounts individually.

For each wallet or account, the detail view may include:

- account name or label
- account reference
- product type
- account status
- supported currencies
- balance by currency
- recent transactions
- virtual account linkage where applicable
- permitted actions
- restrictions or holds where relevant

#### 3.3.3 Multi-Currency Balance View
For eligible multi-currency products, the system shall support display of balances by currency.

The balance view shall support:

- available balance by currency
- reserved balance by currency where applicable
- blocked balance by currency where applicable
- hidden zero-balance currency display rules where configured
- ordering or grouping of balances
- customer-friendly currency labels

#### 3.3.4 Account Servicing Visibility
The Web App shall provide customers with visibility of account status and servicing-related conditions.

This may include:

- active or restricted status
- temporary holds
- document-related restriction
- compliance review status
- dormancy warning where applicable
- customer action required
- customer support contact instruction where needed

#### 3.3.5 Business Customer Multi-User Access
Where business customer functionality is enabled, the system shall support controlled access by multiple customer users.

The system shall enforce account-right rules for:

- business owner or administrator
- finance user
- operational user
- read-only user
- other configured permission groups

The Web App shall show or hide functions based on assigned rights.

### 3.4 Virtual Account Visibility and Use

The Web App shall support customer visibility of virtual account details where the product model includes virtual account services.

#### 3.4.1 Virtual Account Display
The system shall allow eligible customers to view active virtual account details linked to their wallet, account, or product.

Displayed details may include:

- account label
- currency
- account number or masked account number where appropriate
- IBAN, sort code, routing information, or equivalent where applicable
- account holder name
- provider-specific details where display is permitted
- status
- usage instructions

#### 3.4.2 Virtual Account Status Visibility
The system shall display virtual account status, which may include:

- pending issue
- active
- restricted
- suspended
- expired
- closed

The system shall provide customer-friendly messaging where a virtual account is unavailable for use.

#### 3.4.3 Usage Instructions and Restrictions
The system shall present usage guidance and restrictions associated with a virtual account.

This may include:

- accepted currency
- intended funding use
- supported transfer type
- prohibited payment types
- expected sender-name rules where applicable
- processing time guidance
- country or source restrictions where applicable

#### 3.4.4 Inbound Funding Visibility
Where enabled, the system shall provide visibility of inbound funding received through a virtual account.

This may include:

- pending inbound items
- confirmed inbound items
- failed or returned inbound items where visible
- date and time received
- credited amount
- credited currency
- linked wallet or account destination

### 3.5 Beneficiary and Counterparty Management

The Web App shall allow customers to create, review, manage, and use beneficiaries and counterparties for supported transaction types.

#### 3.5.1 Beneficiary Types
The system shall support, as applicable:

- domestic bank beneficiary
- international bank beneficiary
- remittance beneficiary
- wallet beneficiary
- business payee
- internal transfer counterparty where enabled

The set of beneficiary types available shall depend on product configuration and corridor availability.

#### 3.5.2 Beneficiary Creation
The system shall allow customers to create a beneficiary record.

The capture requirements shall vary by payout method, corridor, customer type, and currency.

Required fields may include:

- beneficiary full name or business name
- country
- currency
- payout method
- bank or wallet details
- relationship to sender where required
- address where required
- mobile number where required
- purpose-related information where required

#### 3.5.3 Beneficiary Validation
The system shall validate beneficiary details before a beneficiary becomes available for use.

Validation may include:

- mandatory field validation
- format validation
- corridor-specific field validation
- payout-method-specific validation
- partner-side validation where integrated
- sanctions or screening checks where applicable

The system shall display validation errors or required corrections clearly to the customer.

#### 3.5.4 Beneficiary List and Detail View
The system shall provide customers with a beneficiary list and detail view.

The beneficiary list shall support:

- nickname or label where enabled
- country
- payout method
- status
- recent usage indicator
- search and filter capabilities where appropriate

The detail view shall show the stored beneficiary information permitted for display.

#### 3.5.5 Beneficiary Update and Deactivation
The system shall allow customers to update or deactivate beneficiaries where permitted.

Changes to payout-critical data may require:

- revalidation
- reapproval
- renewed screening
- temporary suspension from use until validation is complete

#### 3.5.6 Beneficiary Restrictions
The system shall prevent use of beneficiaries that are:

- inactive
- restricted
- blocked
- under review
- no longer valid for the selected corridor or payout method

The Web App shall display a user-appropriate reason where permitted.

#### 3.5.7 Business Customer Beneficiary Access
Where business-customer multi-user functionality is enabled, the system shall enforce beneficiary ownership and access rules.

This may include:

- shared beneficiary list
- personal beneficiary list
- beneficiary creation rights by user role
- approval requirement for new beneficiaries
- read-only access for selected business users

### 3.6 FX Quote and Conversion

The Web App shall support generation, review, and confirmation of FX quotes and, where enabled, customer-initiated currency conversion between supported balances or accounts.

#### 3.6.1 Quote Request
The system shall allow eligible customers to request a quote for:

- remittance transfer
- domestic payment where FX applies
- international payment
- wallet conversion
- account conversion
- other supported transaction types

A quote request may include:

- source currency
- destination currency
- send amount or receive amount
- funding source
- payout method
- corridor
- beneficiary where required
- product type

#### 3.6.2 Quote Display
The system shall display the quote result clearly.

The quote display may include:

- exchange rate
- fee amount
- send amount
- receive amount
- spread disclosure where policy requires
- validity period
- payout method
- estimated delivery or processing guidance where available
- quote reference

#### 3.6.3 Quote Expiry and Refresh
The system shall manage quote validity periods.

The Web App shall support:

- countdown or expiry messaging where appropriate
- re-quote on expiry
- refreshed rate and fee display
- prevention of confirmation against an expired quote unless repriced

#### 3.6.4 Customer FX Conversion
Where enabled, the system shall allow customers to convert funds between supported currencies held in their wallet or account.

The conversion journey shall support:

- selection of source balance
- selection of destination currency
- amount entry
- quote review
- confirmation
- resulting balance update
- conversion reference and history entry

#### 3.6.5 Conversion Eligibility and Controls
The system shall enforce conversion controls, including:

- supported currency pairs
- account status
- sufficient balance
- transaction or conversion limits
- restricted customer status
- corridor or product restrictions where applicable

### 3.7 Payments, Transfers, and Remittance Initiation

The Web App shall support customer initiation of supported payment and transfer journeys.

#### 3.7.1 Supported Customer Journeys
The system may support, subject to product configuration:

- remittance transfer
- domestic payment
- international payment
- wallet-to-wallet transfer
- account-to-account transfer
- transfer from held balance
- transfer funded externally where supported
- withdrawal request where supported

#### 3.7.2 Payment Initiation Flow
The customer shall be able to initiate a transaction by completing a structured flow that may include:

- selecting transaction type
- selecting source wallet or account
- selecting beneficiary or counterparty
- entering amount
- selecting payout method
- reviewing quote and fees
- reviewing transaction summary
- authenticating where required
- confirming submission

#### 3.7.3 Funding Method Handling
Where relevant, the system shall support transaction initiation using one or more funding methods, including:

- available wallet or account balance
- linked bank funding where supported
- virtual-account-funded balance
- other tenant-enabled funding routes

The Web App shall clearly indicate the funding source used for the transaction.

#### 3.7.4 Review and Confirmation
Before final submission, the system shall present a review screen including, as applicable:

- source account
- beneficiary
- send amount
- receive amount
- fees
- exchange rate
- transaction reference preview where applicable
- estimated processing guidance
- important warnings or restrictions
- customer acknowledgement requirement where configured

#### 3.7.5 Submission Result
Upon submission, the system shall provide confirmation that the transaction has been accepted, queued, or referred for further review.

The confirmation may include:

- transaction reference
- status
- summary of transaction details
- next-step guidance
- tracking entry point
- download or email confirmation where configured

#### 3.7.6 Approval Model for Business Customers
Where business customer workflows are enabled, the system may support maker-checker or multi-user approval before final transaction release.

This shall support:

- initiator role
- approver role
- pending approval status
- approval request visibility
- approval expiry or cancellation where configured
- rejection by approver
- audit trail of approval actions

#### 3.7.7 Transaction Restrictions and Failure Handling
The system shall prevent or restrict transaction initiation where required by controls, including:

- insufficient balance
- onboarding incomplete
- account restricted
- beneficiary invalid
- corridor unavailable
- payout method unavailable
- quote expired
- compliance or fraud hold
- limit breach
- system maintenance control

The system shall provide customer-appropriate error or status messaging.

### 3.8 Transaction and Account Activity Tracking

The Web App shall allow customers to view account activity, transaction status, and event progression.

#### 3.8.1 Activity Overview
The system shall provide a consolidated activity view including:

- recent transactions
- recent funding events
- recent FX conversions
- inbound virtual-account funding events where applicable
- pending actions
- failed actions requiring review

#### 3.8.2 Transaction Status Visibility
The system shall display the current status of each transaction.

Indicative customer-visible statuses may include:

- pending
- awaiting funds
- under review
- in progress
- paid
- failed
- cancelled
- refunded
- reversed where applicable

The system may translate internal statuses into customer-friendly wording.

#### 3.8.3 Transaction Detail View
The customer shall be able to open a detailed transaction view.

The detail view may include:

- transaction reference
- transaction type
- source and destination details
- send and receive amount
- fees
- exchange rate
- payout method
- timestamps
- status history
- beneficiary used
- reason for failure where permitted
- refund status where applicable
- receipt or confirmation view

#### 3.8.4 Account Activity History
The system shall allow customers to review historical account activity by date range and activity type.

This may include:

- funding
- payments
- remittances
- conversions
- inbound credits
- withdrawals
- refunds
- reversals

#### 3.8.5 Search and Filters
The system shall support customer search and filtering of activity, which may include:

- date range
- activity type
- status
- currency
- beneficiary
- account
- amount band

### 3.9 Statements, Documents, and Communication

The Web App shall provide customers with secure access to account statements, transaction confirmations, submitted and requested documents, service communications, and notification settings relevant to their profile, accounts, and activity.

The functionality under this section shall be subject to product configuration, customer type, account status, communication channel availability, and applicable regulatory or operational restrictions.

#### 3.9.1 Statement Access
The system shall allow eligible customers to access account statements for supported wallets and current accounts.

Statement access shall support, as applicable:

- statement by account
- statement by currency
- statement by date range
- opening and closing balance
- transaction list with date, reference, amount, currency, and narrative where available
- downloadable statement output
- statement availability by product
- statement generation for completed periods and, where permitted, custom date ranges

The system shall ensure that customers can only view statements for accounts to which they have authorised access.

#### 3.9.2 Transaction Confirmations and Receipts
The system shall allow customers to access transaction-related confirmations and receipts for supported activities.

This may include:

- payment confirmation
- remittance confirmation
- transaction receipt
- FX conversion confirmation
- account funding confirmation
- withdrawal confirmation where applicable
- refund confirmation where applicable

Each confirmation or receipt may include, as applicable:

- transaction reference
- transaction type
- account or wallet used
- beneficiary or counterparty summary
- send amount
- receive amount
- fee amount
- exchange rate where applicable
- date and time
- transaction status
- customer-facing narrative

#### 3.9.3 Document Access and Submission
The Web App shall allow customers to view, upload, replace, and manage documents relevant to onboarding, periodic review, servicing, and transaction support, subject to permission and status controls.

The system shall support, as applicable:

- upload of requested documents
- upload of additional supporting documents where permitted
- review of previously submitted documents where customer visibility is allowed
- view of document type and request category
- view of document request status
- replacement of rejected or expired documents
- submission of refreshed documents following expiry or review request
- view of relevant due dates or overdue prompts

The system shall validate supported file types, file size, and mandatory document requirements before accepting submission.

#### 3.9.4 Document Request and Review Status
The system shall provide visibility of document-related requests and review outcomes relevant to the customer.

This may include:

- requested documents
- request date
- due date where applicable
- request status
- uploaded status
- under review status
- approved or verified status
- rejected status
- expired status
- additional information required status

Where appropriate, the system shall provide customer-friendly guidance on what action is required next.

#### 3.9.5 Customer Communications
The Web App shall provide customers with access to relevant service and operational communications where such visibility is enabled.

This may include:

- onboarding requests
- account alerts
- transaction notifications
- security notifications
- document requests
- compliance-related requests where customer disclosure is permitted
- service notices
- maintenance notifications
- support-related messages where supported

The system shall present communications in a structured and customer-friendly format, with appropriate timestamps and status indicators where available.

#### 3.9.6 Communication History
Where configured, the system shall maintain a customer-facing history of relevant communications delivered through supported channels.

The communication history may include:

- email notifications
- SMS notifications
- in-app or web notifications
- document request messages
- onboarding follow-up messages
- transaction-related service updates
- security messages

For each communication, the system may display:

- communication type
- subject or title
- date and time sent
- delivery status where available
- read or viewed status where available
- linked action or request where applicable

#### 3.9.7 Notification and Communication Preferences
The system shall allow customers to manage communication and notification preferences where permitted by product design, legal requirements, and tenant policy.

Preferences may include:

- email notifications
- SMS notifications
- in-app or web notifications where supported
- marketing communications
- service-update communications where configurable
- transaction alert preferences
- security notification preferences where configurable
- language preference for communications

The system shall not allow customers to disable mandatory regulatory, security, or critical service communications where such communications must continue to be sent.

#### 3.9.8 Downloads, Exports, and Customer Access Controls
The system shall support controlled customer access to downloadable documents and outputs where enabled.

This may include:

- account statements
- transaction receipts
- confirmations
- submitted document copies where permitted
- request summaries where applicable

The system shall apply access controls to ensure that customers can only download records linked to their own authorised profile, wallet, account, or business-user permission scope.

### 3.10 Profile, Customer User, and Preference Management

The Web App shall allow customers to manage permitted profile information, linked customer users where applicable, account-level access settings, and personal preferences relevant to their use of the platform.

The scope of profile and user management shall vary depending on whether the customer is an individual customer or a business customer operating a multi-user relationship.

#### 3.10.1 Profile Overview and Customer Information
The system shall provide customers with a profile area showing their key customer information and current status.

The profile overview may include, as applicable:

- customer name or business name
- customer reference
- customer type
- onboarding or verification status
- account status
- contact details
- address details
- preferred language
- communication preferences
- linked products or services
- review or action prompts where applicable

The system shall clearly distinguish between information that is view-only and information that the customer is permitted to update directly.

#### 3.10.2 Profile Management
The system shall allow customers to review and update permitted profile fields.

Updatable fields may include:

- contact email
- phone number
- correspondence address
- preferred language
- communication preferences
- selected display preferences
- business contact details where applicable

The system shall restrict direct editing of protected identity, business registration, or compliance-sensitive fields where policy requires:

- review by the Backoffice
- submission of supporting documents
- re-verification
- approval before the change becomes effective

Where a protected field cannot be changed directly, the system shall provide the customer with appropriate guidance or a request-submission route where supported.

#### 3.10.3 Business Customer User Management
Where business customer functionality is enabled, authorised customer users shall be able to manage additional users linked to the business profile, subject to their assigned rights.

This may include:

- invite new user
- assign role or permission group
- update permission scope where permitted
- deactivate or suspend user access
- resend invitation
- review user list
- view user status
- restrict access by account, wallet, or function where supported

The system shall enforce customer-user permission rules so that only authorised business administrators can create or manage other users.

#### 3.10.4 Account Rights and User Access Visibility
Where business-customer multi-user functionality is enabled, the system shall provide visibility of user access rights and account-level permissions.

This may include:

- which users can access which wallets or accounts
- role or permission group assigned
- whether a user has payment-initiation rights
- whether a user has approval rights
- whether a user has read-only access
- whether a user is the primary business administrator or owner user

The system shall ensure that each customer user only sees accounts, functions, and actions within their authorised scope.

#### 3.10.5 Preference Management
The system shall support customer-level and, where applicable, customer-user-level preference management.

Preferences may include:

- preferred language
- display currency where applicable
- communication preferences
- notification preferences
- marketing preference
- selected dashboard or display preferences where supported
- remembered device preference where permitted
- customer-user-specific experience settings where applicable

The system shall store updated preferences with appropriate timestamp and apply them across supported Web App journeys.

#### 3.10.6 Security-Related Profile Preferences
The profile area may also support selected customer-controlled security preferences, where these are enabled separately from the core security controls in section 3.11.

This may include:

- preferred MFA method where multiple options are supported
- remembered device settings where permitted
- security-notification preferences where configurable
- session-awareness preferences where supported

Any changes to security-related preferences shall be subject to appropriate authentication and control rules.

#### 3.10.7 Customer Requests for Restricted Changes
Where a customer needs to update information that cannot be changed directly in the Web App, the system may support submission of a request for review.

This may include requests relating to:

- legal name correction
- business information change
- change of authorised representative
- protected contact detail change
- account ownership-related change
- correction of onboarding data
- other compliance-sensitive profile changes

The system shall support capture of supporting information, supporting documents, and request status where this workflow is enabled.

#### 3.10.8 Service Requests and Customer Support Access
The system shall support customer servicing features and access to customer support channels where enabled.

This may include:

- raise support request
- contact support
- view support instructions
- refer to FAQ or help content
- submit an operational query
- submit a document-related query
- track support request or service case status where supported
- view responses or follow-up instructions where supported

The system shall provide clear guidance on which requests can be resolved directly in the Web App and which require Backoffice review or customer support handling.

#### 3.10.9 Audit and Event Traceability
The platform shall maintain traceability of material profile, customer-user, and preference-management actions performed through the Web App.

This shall include, as applicable:

- profile field update
- customer-user invitation
- customer-user activation
- customer-user deactivation
- permission-scope change
- preference update
- communication-preference change
- restricted-change request submission
- support request creation

Such events shall be available for internal audit, servicing, dispute handling, and security review in accordance with applicable permissions and retention rules.

### 3.11 App Security and Session Management

The Web App shall support secure authentication, access control, credential management, and session security for customer-facing use.

#### 3.11.1 Login and Logout
The system shall support secure login and logout for eligible users.

The login process may support:

- email and password
- username and password where configured
- tenant-specific login route where applicable
- white-label domain routing
- session invalidation on logout

#### 3.11.2 MFA and Step-Up Authentication
The system shall support MFA where required by policy, customer type, risk model, or selected action.

MFA support may include:

- OTP-based MFA
- app-based authenticator MFA
- challenge on login
- challenge on sensitive action
- challenge on new device
- challenge on payment confirmation
- challenge on profile change

#### 3.11.3 Password and Credential Management
The system shall support:

- password creation
- password reset
- forgot-password workflow
- password change by logged-in user
- password-policy enforcement
- invalid credential handling
- account lockout after repeated failed attempts where configured

#### 3.11.4 Session Security
The system shall support session-control rules including:

- session timeout
- inactivity timeout
- concurrent-session rules where configured
- suspicious session invalidation
- forced re-authentication for sensitive actions
- session revocation on password reset or security event where applicable

#### 3.11.5 Device and Access Protection
The system may support additional access protection controls, including:

- new-device verification
- suspicious-login detection
- geo or IP anomaly detection where configured
- remembered device model where permitted
- browser-session trust controls where permitted

#### 3.11.6 Security Event Communication
The system shall support notification of material security events to the customer where configured.

This may include:

- new login
- password changed
- MFA changed
- suspicious login
- account locked
- profile-security change
- high-risk payment action

#### 3.11.7 Access Restriction Messaging
Where customer access is restricted due to onboarding, compliance, security, or operational reasons, the Web App shall display controlled messaging appropriate to the customer and the reason category permitted for disclosure.

### 3.12 Web App Audit, Traceability, and Customer-Facing Event History

The platform shall maintain traceability of material customer-facing actions taken through the Web App.

This shall include, as applicable:

- registration started and completed
- verification completed
- onboarding submitted
- document uploaded
- beneficiary created or changed
- quote accepted
- transaction initiated
- transaction confirmed
- profile updated
- password reset
- login event
- MFA event
- business-user invitation and approval actions where applicable

The event history shall be available for internal audit, customer servicing, security review, and dispute support in accordance with applicable permissions and retention rules.

## 4. Pangea Mobile App

The Pangea Mobile App shall be available for both iOS and Android.

Both mobile applications shall provide the same core customer journeys and functional capabilities as the Web App, subject to device-specific design, operating-system capabilities, security controls, notification capabilities, and mobile usability considerations.

Any differences between the Web App and Mobile App shall be limited to channel-specific user experience, device capabilities, security controls, and notification methods, and shall not result in inconsistent business behaviour for the customer unless explicitly approved as a product-specific exception.

The Mobile App shall support customer onboarding, wallet and account access, virtual account visibility, beneficiary management, FX and payment journeys, transaction tracking, document access, profile servicing, and security controls, subject to product configuration, tenant entitlement, customer type, and applicable regulatory requirements.

The Mobile App shall also support:

- mobile-native user experience
- push notifications where configured
- secure device session handling
- biometric authentication where supported and approved
- secure in-app review of balances, transactions, and account activity

### 4.1 Mobile Registration and Access Initiation

The Mobile App shall allow eligible users to begin access to the platform through a controlled registration and account-access process.

#### 4.1.1 Registration Eligibility
The system shall support customer registration for:

- individual customers
- business customers
- invited business customer users where applicable
- white-label customer channels where configured

The system shall enforce registration eligibility based on:

- country or jurisdiction
- customer type
- tenant entitlement
- product availability
- corridor restrictions
- age or residency rules where applicable

#### 4.1.2 Registration Data Capture
The system shall support capture of registration details required to create an initial customer profile or access request.

For individual customers, registration data may include:

- first name
- last name
- email address
- mobile number
- country of residence
- nationality where required
- date of birth where required
- password or credential creation
- acceptance of terms and conditions
- acceptance of privacy notice
- marketing preference where applicable

For business customers, the system may support capture of:

- business name
- trading name where applicable
- registration number where applicable
- incorporation country
- business contact email
- business contact phone number
- primary authorised representative details
- password or credential creation
- acceptance of terms and conditions
- acceptance of privacy notice

#### 4.1.3 Registration Verification
The system shall support verification of customer contact details during registration.

Verification methods may include:

- email OTP or verification link
- SMS OTP
- combined email and mobile verification
- invitation-token verification for invited business users

The system shall prevent full account activation until required verification steps are completed.

#### 4.1.4 Terms, Consents, and Declarations
The system shall record customer acceptance of required legal and operational declarations.

This may include:

- terms and conditions
- privacy notice
- cookie or tracking consent where applicable
- electronic communication consent
- product-specific declarations
- customer eligibility declarations
- regulatory disclosures
- marketing consent or opt-out

The system shall maintain a timestamped record of the version accepted by the customer.

#### 4.1.5 Invited Access for Business Customer Users
Where business customer functionality is enabled, the system shall support invitation-based access for additional customer users.

The invitation model shall support:

- invitation by authorised business owner or administrator where permitted
- invitation by Backoffice-assisted process where applicable
- invitation token or link
- expiry date for invitation
- role or permission assignment
- resend invitation
- invitation withdrawal before acceptance

#### 4.1.6 Registration Status Handling
The system shall support registration and pre-onboarding statuses, which may include:

- started
- pending verification
- pending onboarding
- pending additional information
- active
- suspended
- rejected
- closed

The Mobile App shall present status-appropriate messaging to the customer.

### 4.2 Identity Verification and Onboarding

The Mobile App shall support onboarding journeys for KYC, KYB, and related identity and eligibility verification processes.

#### 4.2.1 Onboarding Journey Types
The system shall support onboarding journeys for:

- individual customers
- business customers
- authorised business representatives
- invited business customer users where identity verification is required

The exact onboarding workflow may vary by customer type, product, country, and risk model.

#### 4.2.2 Individual Customer Onboarding
For individual customers, the Mobile App shall support collection of onboarding information, which may include:

- full legal name
- residential address
- date of birth
- nationality
- country of residence
- occupation
- source of funds information
- tax residency where applicable
- intended product usage
- expected transaction behaviour where required
- identity document information
- proof of address information

#### 4.2.3 Business Customer Onboarding
For business customers, the Mobile App shall support collection of business onboarding information, which may include:

- legal entity name
- trading name
- business registration number
- incorporation country
- registered address
- operating address
- nature of business
- industry sector
- ownership structure
- authorised representative information
- director details where required
- shareholder details where required
- UBO details where required
- source of funds / source of wealth information where required
- expected payment activity where required

#### 4.2.4 Document Upload During Onboarding
The system shall support upload of required onboarding documents.

This may include:

- passport
- driving licence
- national ID card
- proof of address
- incorporation certificate
- shareholder register
- UBO declaration
- bank statement
- proof of source of funds
- other tenant-configured document types

The Mobile App shall support device-based upload methods where available, including:

- camera capture
- photo library selection
- file upload from supported device storage locations

The system shall validate supported file types, file size, image quality where applicable, and mandatory document requirements.

#### 4.2.5 Onboarding Review Status Visibility
The Mobile App shall provide customers with visibility of their onboarding status.

Status visibility may include:

- not started
- in progress
- submitted
- under review
- additional information required
- approved
- rejected
- restricted

The system shall provide clear customer messaging describing next steps where appropriate.

#### 4.2.6 Additional Information Requests
The system shall support requests for additional information during onboarding or subsequent review.

The Mobile App shall allow customers to:

- view the request
- understand the reason or category of request where appropriate
- upload additional documents
- correct or complete required data
- submit requested information
- view request due date where applicable

#### 4.2.7 Saved Progress and Resume
The system shall allow customers to save onboarding progress and resume later, subject to security and session rules.

The system shall support:

- draft save
- partial completion
- reminder to return to incomplete onboarding
- expiry or timeout of incomplete onboarding where configured

### 4.3 Wallet and Current Account Access

The Mobile App shall allow eligible customers to access, view, and manage their wallets and current accounts, subject to product and permission configuration.

#### 4.3.1 Account Dashboard
The system shall provide an account dashboard showing key account information.

The dashboard may include:

- available wallets or accounts
- account status
- available balance
- reserved balance where applicable
- blocked balance where applicable
- recent activity
- shortcuts to key actions
- alerts and notifications
- onboarding or review reminders
- pending tasks

#### 4.3.2 Account List and Account Detail View
The system shall allow customers to view their wallets or accounts individually.

For each wallet or account, the detail view may include:

- account name or label
- account reference
- product type
- account status
- supported currencies
- balance by currency
- recent transactions
- virtual account linkage where applicable
- permitted actions
- restrictions or holds where relevant

#### 4.3.3 Multi-Currency Balance View
For eligible multi-currency products, the system shall support display of balances by currency.

The balance view shall support:

- available balance by currency
- reserved balance by currency where applicable
- blocked balance by currency where applicable
- hidden zero-balance currency display rules where configured
- ordering or grouping of balances
- customer-friendly currency labels

#### 4.3.4 Account Servicing Visibility
The Mobile App shall provide customers with visibility of account status and servicing-related conditions.

This may include:

- active or restricted status
- temporary holds
- document-related restriction
- compliance review status
- dormancy warning where applicable
- customer action required
- customer support contact instruction where needed

#### 4.3.5 Business Customer Multi-User Access
Where business customer functionality is enabled, the system shall support controlled access by multiple customer users.

The system shall enforce account-right rules for:

- business owner or administrator
- finance user
- operational user
- read-only user
- other configured permission groups

The Mobile App shall show or hide functions based on assigned rights.

### 4.4 Virtual Account Visibility and Use

The Mobile App shall support customer visibility of virtual account details where the product model includes virtual account services.

#### 4.4.1 Virtual Account Display
The system shall allow eligible customers to view active virtual account details linked to their wallet, account, or product.

Displayed details may include:

- account label
- currency
- account number or masked account number where appropriate
- IBAN, sort code, routing information, or equivalent where applicable
- account holder name
- provider-specific details where display is permitted
- status
- usage instructions

#### 4.4.2 Virtual Account Status Visibility
The system shall display virtual account status, which may include:

- pending issue
- active
- restricted
- suspended
- expired
- closed

The system shall provide customer-friendly messaging where a virtual account is unavailable for use.

#### 4.4.3 Usage Instructions and Restrictions
The system shall present usage guidance and restrictions associated with a virtual account.

This may include:

- accepted currency
- intended funding use
- supported transfer type
- prohibited payment types
- expected sender-name rules where applicable
- processing time guidance
- country or source restrictions where applicable

#### 4.4.4 Inbound Funding Visibility
Where enabled, the system shall provide visibility of inbound funding received through a virtual account.

This may include:

- pending inbound items
- confirmed inbound items
- failed or returned inbound items where visible
- date and time received
- credited amount
- credited currency
- linked wallet or account destination

### 4.5 Beneficiary and Counterparty Management

The Mobile App shall allow customers to create, review, manage, and use beneficiaries and counterparties for supported transaction types.

#### 4.5.1 Beneficiary Types
The system shall support, as applicable:

- domestic bank beneficiary
- international bank beneficiary
- remittance beneficiary
- wallet beneficiary
- business payee
- internal transfer counterparty where enabled

The set of beneficiary types available shall depend on product configuration and corridor availability.

#### 4.5.2 Beneficiary Creation
The system shall allow customers to create a beneficiary record.

The capture requirements shall vary by payout method, corridor, customer type, and currency.

Required fields may include:

- beneficiary full name or business name
- country
- currency
- payout method
- bank or wallet details
- relationship to sender where required
- address where required
- mobile number where required
- purpose-related information where required

#### 4.5.3 Beneficiary Validation
The system shall validate beneficiary details before a beneficiary becomes available for use.

Validation may include:

- mandatory field validation
- format validation
- corridor-specific field validation
- payout-method-specific validation
- partner-side validation where integrated
- sanctions or screening checks where applicable

The system shall display validation errors or required corrections clearly to the customer.

#### 4.5.4 Beneficiary List and Detail View
The system shall provide customers with a beneficiary list and detail view.

The beneficiary list shall support:

- nickname or label where enabled
- country
- payout method
- status
- recent usage indicator
- search and filter capabilities where appropriate

The detail view shall show the stored beneficiary information permitted for display.

#### 4.5.5 Beneficiary Update and Deactivation
The system shall allow customers to update or deactivate beneficiaries where permitted.

Changes to payout-critical data may require:

- revalidation
- reapproval
- renewed screening
- temporary suspension from use until validation is complete

#### 4.5.6 Beneficiary Restrictions
The system shall prevent use of beneficiaries that are:

- inactive
- restricted
- blocked
- under review
- no longer valid for the selected corridor or payout method

The Mobile App shall display a user-appropriate reason where permitted.

#### 4.5.7 Business Customer Beneficiary Access
Where business-customer multi-user functionality is enabled, the system shall enforce beneficiary ownership and access rules.

This may include:

- shared beneficiary list
- personal beneficiary list
- beneficiary creation rights by user role
- approval requirement for new beneficiaries
- read-only access for selected business users

### 4.6 FX Quote and Conversion

The Mobile App shall support generation, review, and confirmation of FX quotes and, where enabled, customer-initiated currency conversion between supported balances or accounts.

#### 4.6.1 Quote Request
The system shall allow eligible customers to request a quote for:

- remittance transfer
- domestic payment where FX applies
- international payment
- wallet conversion
- account conversion
- other supported transaction types

A quote request may include:

- source currency
- destination currency
- send amount or receive amount
- funding source
- payout method
- corridor
- beneficiary where required
- product type

#### 4.6.2 Quote Display
The system shall display the quote result clearly.

The quote display may include:

- exchange rate
- fee amount
- send amount
- receive amount
- spread disclosure where policy requires
- validity period
- payout method
- estimated delivery or processing guidance where available
- quote reference

#### 4.6.3 Quote Expiry and Refresh
The system shall manage quote validity periods.

The Mobile App shall support:

- countdown or expiry messaging where appropriate
- re-quote on expiry
- refreshed rate and fee display
- prevention of confirmation against an expired quote unless repriced

#### 4.6.4 Customer FX Conversion
Where enabled, the system shall allow customers to convert funds between supported currencies held in their wallet or account.

The conversion journey shall support:

- selection of source balance
- selection of destination currency
- amount entry
- quote review
- confirmation
- resulting balance update
- conversion reference and history entry

#### 4.6.5 Conversion Eligibility and Controls
The system shall enforce conversion controls, including:

- supported currency pairs
- account status
- sufficient balance
- transaction or conversion limits
- restricted customer status
- corridor or product restrictions where applicable

### 4.7 Payments, Transfers, and Remittance Initiation

The Mobile App shall support customer initiation of supported payment and transfer journeys.

#### 4.7.1 Supported Customer Journeys
The system may support, subject to product configuration:

- remittance transfer
- domestic payment
- international payment
- wallet-to-wallet transfer
- account-to-account transfer
- transfer from held balance
- transfer funded externally where supported
- withdrawal request where supported

#### 4.7.2 Payment Initiation Flow
The customer shall be able to initiate a transaction by completing a structured flow that may include:

- selecting transaction type
- selecting source wallet or account
- selecting beneficiary or counterparty
- entering amount
- selecting payout method
- reviewing quote and fees
- reviewing transaction summary
- authenticating where required
- confirming submission

#### 4.7.3 Funding Method Handling
Where relevant, the system shall support transaction initiation using one or more funding methods, including:

- available wallet or account balance
- linked bank funding where supported
- virtual-account-funded balance
- other tenant-enabled funding routes

The Mobile App shall clearly indicate the funding source used for the transaction.

#### 4.7.4 Review and Confirmation
Before final submission, the system shall present a review screen including, as applicable:

- source account
- beneficiary
- send amount
- receive amount
- fees
- exchange rate
- transaction reference preview where applicable
- estimated processing guidance
- important warnings or restrictions
- customer acknowledgement requirement where configured

#### 4.7.5 Submission Result
Upon submission, the system shall provide confirmation that the transaction has been accepted, queued, or referred for further review.

The confirmation may include:

- transaction reference
- status
- summary of transaction details
- next-step guidance
- tracking entry point
- downloadable or shareable confirmation where configured

#### 4.7.6 Approval Model for Business Customers
Where business customer workflows are enabled, the system may support maker-checker or multi-user approval before final transaction release.

This shall support:

- initiator role
- approver role
- pending approval status
- approval request visibility
- approval expiry or cancellation where configured
- rejection by approver
- audit trail of approval actions

#### 4.7.7 Transaction Restrictions and Failure Handling
The system shall prevent or restrict transaction initiation where required by controls, including:

- insufficient balance
- onboarding incomplete
- account restricted
- beneficiary invalid
- corridor unavailable
- payout method unavailable
- quote expired
- compliance or fraud hold
- limit breach
- system maintenance control

The system shall provide customer-appropriate error or status messaging.

### 4.8 Transaction and Account Activity Tracking

The Mobile App shall allow customers to view account activity, transaction status, and event progression.

#### 4.8.1 Activity Overview
The system shall provide a consolidated activity view including:

- recent transactions
- recent funding events
- recent FX conversions
- inbound virtual-account funding events where applicable
- pending actions
- failed actions requiring review

#### 4.8.2 Transaction Status Visibility
The system shall display the current status of each transaction.

Indicative customer-visible statuses may include:

- pending
- awaiting funds
- under review
- in progress
- paid
- failed
- cancelled
- refunded
- reversed where applicable

The system may translate internal statuses into customer-friendly wording.

#### 4.8.3 Transaction Detail View
The customer shall be able to open a detailed transaction view.

The detail view may include:

- transaction reference
- transaction type
- source and destination details
- send and receive amount
- fees
- exchange rate
- payout method
- timestamps
- status history
- beneficiary used
- reason for failure where permitted
- refund status where applicable
- receipt or confirmation view

#### 4.8.4 Account Activity History
The system shall allow customers to review historical account activity by date range and activity type.

This may include:

- funding
- payments
- remittances
- conversions
- inbound credits
- withdrawals
- refunds
- reversals

#### 4.8.5 Search and Filters
The system shall support customer search and filtering of activity, which may include:

- date range
- activity type
- status
- currency
- beneficiary
- account
- amount band

### 4.9 Statements, Documents, and Communication

The Mobile App shall provide customers with secure access to account statements, transaction confirmations, submitted and requested documents, service communications, and notification settings relevant to their profile, accounts, and activity.

The functionality under this section shall be subject to product configuration, customer type, account status, communication channel availability, and applicable regulatory or operational restrictions.

#### 4.9.1 Statement Access
The system shall allow eligible customers to access account statements for supported wallets and current accounts.

Statement access shall support, as applicable:

- statement by account
- statement by currency
- statement by date range
- opening and closing balance
- transaction list with date, reference, amount, currency, and narrative where available
- downloadable statement output where supported
- statement availability by product
- statement generation for completed periods and, where permitted, custom date ranges

The system shall ensure that customers can only view statements for accounts to which they have authorised access.

#### 4.9.2 Transaction Confirmations and Receipts
The system shall allow customers to access transaction-related confirmations and receipts for supported activities.

This may include:

- payment confirmation
- remittance confirmation
- transaction receipt
- FX conversion confirmation
- account funding confirmation
- withdrawal confirmation where applicable
- refund confirmation where applicable

Each confirmation or receipt may include, as applicable:

- transaction reference
- transaction type
- account or wallet used
- beneficiary or counterparty summary
- send amount
- receive amount
- fee amount
- exchange rate where applicable
- date and time
- transaction status
- customer-facing narrative

#### 4.9.3 Document Access and Submission
The Mobile App shall allow customers to view, upload, replace, and manage documents relevant to onboarding, periodic review, servicing, and transaction support, subject to permission and status controls.

The system shall support, as applicable:

- upload of requested documents
- upload of additional supporting documents where permitted
- review of previously submitted documents where customer visibility is allowed
- view of document type and request category
- view of document request status
- replacement of rejected or expired documents
- submission of refreshed documents following expiry or review request
- view of relevant due dates or overdue prompts

The Mobile App shall support device-based upload methods where available, including camera capture, photo library selection, and file upload from supported device storage locations.

#### 4.9.4 Document Request and Review Status
The system shall provide visibility of document-related requests and review outcomes relevant to the customer.

This may include:

- requested documents
- request date
- due date where applicable
- request status
- uploaded status
- under review status
- approved or verified status
- rejected status
- expired status
- additional information required status

Where appropriate, the system shall provide customer-friendly guidance on what action is required next.

#### 4.9.5 Customer Communications
The Mobile App shall provide customers with access to relevant service and operational communications where such visibility is enabled.

This may include:

- onboarding requests
- account alerts
- transaction notifications
- security notifications
- document requests
- compliance-related requests where customer disclosure is permitted
- service notices
- maintenance notifications
- support-related messages where supported

The system shall present communications in a structured and customer-friendly format, with appropriate timestamps and status indicators where available.

#### 4.9.6 Communication History
Where configured, the system shall maintain a customer-facing history of relevant communications delivered through supported channels.

The communication history may include:

- push notifications
- email notifications
- SMS notifications
- in-app notifications
- document request messages
- onboarding follow-up messages
- transaction-related service updates
- security messages

For each communication, the system may display:

- communication type
- subject or title
- date and time sent
- delivery status where available
- read or viewed status where available
- linked action or request where applicable

#### 4.9.7 Notification and Communication Preferences
The system shall allow customers to manage communication and notification preferences where permitted by product design, legal requirements, and tenant policy.

Preferences may include:

- push notifications
- email notifications
- SMS notifications
- in-app notifications where supported
- marketing communications
- service-update communications where configurable
- transaction alert preferences
- security notification preferences where configurable
- language preference for communications

The system shall not allow customers to disable mandatory regulatory, security, or critical service communications where such communications must continue to be sent.

#### 4.9.8 Downloads, Exports, and Customer Access Controls
The system shall support controlled customer access to downloadable documents and outputs where enabled.

This may include:

- account statements
- transaction receipts
- confirmations
- submitted document copies where permitted
- request summaries where applicable

The system shall apply access controls to ensure that customers can only download records linked to their own authorised profile, wallet, account, or business-user permission scope.

### 4.10 Profile, Customer User, and Preference Management

The Mobile App shall allow customers to manage permitted profile information, linked customer users where applicable, account-level access settings, and personal preferences relevant to their use of the platform.

The scope of profile and user management shall vary depending on whether the customer is an individual customer or a business customer operating a multi-user relationship.

#### 4.10.1 Profile Overview and Customer Information
The system shall provide customers with a profile area showing their key customer information and current status.

The profile overview may include, as applicable:

- customer name or business name
- customer reference
- customer type
- onboarding or verification status
- account status
- contact details
- address details
- preferred language
- communication preferences
- linked products or services
- review or action prompts where applicable

The system shall clearly distinguish between information that is view-only and information that the customer is permitted to update directly.

#### 4.10.2 Profile Management
The system shall allow customers to review and update permitted profile fields.

Updatable fields may include:

- contact email
- phone number
- correspondence address
- preferred language
- communication preferences
- selected display preferences
- business contact details where applicable

The system shall restrict direct editing of protected identity, business registration, or compliance-sensitive fields where policy requires:

- review by the Backoffice
- submission of supporting documents
- re-verification
- approval before the change becomes effective

Where a protected field cannot be changed directly, the system shall provide the customer with appropriate guidance or a request-submission route where supported.

#### 4.10.3 Business Customer User Management
Where business customer functionality is enabled, authorised customer users shall be able to manage additional users linked to the business profile, subject to their assigned rights.

This may include:

- invite new user
- assign role or permission group
- update permission scope where permitted
- deactivate or suspend user access
- resend invitation
- review user list
- view user status
- restrict access by account, wallet, or function where supported

The system shall enforce customer-user permission rules so that only authorised business administrators can create or manage other users.

#### 4.10.4 Account Rights and User Access Visibility
Where business-customer multi-user functionality is enabled, the system shall provide visibility of user access rights and account-level permissions.

This may include:

- which users can access which wallets or accounts
- role or permission group assigned
- whether a user has payment-initiation rights
- whether a user has approval rights
- whether a user has read-only access
- whether a user is the primary business administrator or owner user

The system shall ensure that each customer user only sees accounts, functions, and actions within their authorised scope.

#### 4.10.5 Preference Management
The system shall support customer-level and, where applicable, customer-user-level preference management.

Preferences may include:

- preferred language
- display currency where applicable
- communication preferences
- notification preferences
- marketing preference
- selected dashboard or display preferences where supported
- remembered device preference where permitted
- customer-user-specific experience settings where applicable

The system shall store updated preferences with appropriate timestamp and apply them across supported Mobile App journeys.

#### 4.10.6 Security-Related Profile Preferences
The profile area may also support selected customer-controlled security preferences, where these are enabled separately from the core security controls in section 4.11.

This may include:

- preferred MFA method where multiple options are supported
- remembered device settings where permitted
- security-notification preferences where configurable
- session-awareness preferences where supported
- biometric login preference where supported

Any changes to security-related preferences shall be subject to appropriate authentication and control rules.

#### 4.10.7 Customer Requests for Restricted Changes
Where a customer needs to update information that cannot be changed directly in the Mobile App, the system may support submission of a request for review.

This may include requests relating to:

- legal name correction
- business information change
- change of authorised representative
- protected contact detail change
- account ownership-related change
- correction of onboarding data
- other compliance-sensitive profile changes

The system shall support capture of supporting information, supporting documents, and request status where this workflow is enabled.

#### 4.10.8 Service Requests and Customer Support Access
The system shall support customer servicing features and access to customer support channels where enabled.

This may include:

- raise support request
- contact support
- view support instructions
- refer to FAQ or help content
- submit an operational query
- submit a document-related query
- track support request or service case status where supported
- view responses or follow-up instructions where supported

The system shall provide clear guidance on which requests can be resolved directly in the Mobile App and which require Backoffice review or customer support handling.

#### 4.10.9 Audit and Event Traceability
The platform shall maintain traceability of material profile, customer-user, and preference-management actions performed through the Mobile App.

This shall include, as applicable:

- profile field update
- customer-user invitation
- customer-user activation
- customer-user deactivation
- permission-scope change
- preference update
- communication-preference change
- restricted-change request submission
- support request creation

Such events shall be available for internal audit, servicing, dispute handling, and security review in accordance with applicable permissions and retention rules.

### 4.11 Mobile App Security and Device Session Management

The Mobile App shall support secure authentication, access control, credential management, device security, and session handling for mobile customer use.

#### 4.11.1 Login and Logout
The system shall support secure login and logout for eligible users.

The login process may support:

- email and password
- username and password where configured
- tenant-specific login route where applicable
- white-label application or domain routing
- session invalidation on logout

#### 4.11.2 MFA and Step-Up Authentication
The system shall support MFA where required by policy, customer type, risk model, or selected action.

MFA support may include:

- OTP-based MFA
- app-based authenticator MFA
- challenge on login
- challenge on sensitive action
- challenge on new device
- challenge on payment confirmation
- challenge on profile change

#### 4.11.3 Password and Credential Management
The system shall support:

- password creation
- password reset
- forgot-password workflow
- password change by logged-in user
- password-policy enforcement
- invalid credential handling
- account lockout after repeated failed attempts where configured

#### 4.11.4 Secure Device Session Handling
The Mobile App shall support secure session-control rules including:

- session timeout
- inactivity timeout
- secure token storage
- forced re-authentication after defined events
- session revocation on password reset or security event where applicable
- device-session invalidation on logout where applicable
- concurrent-device rules where configured

#### 4.11.5 Biometric Authentication
Where supported by the device and approved by tenant policy, the Mobile App shall support biometric authentication.

This may include:

- Face ID
- Touch ID
- fingerprint authentication
- device-supported biometric equivalent

Biometric authentication may be used for:

- login re-entry
- step-up confirmation
- sensitive in-app actions where configured

The system shall require secure enrolment and allow the customer to enable or disable biometric access where permitted.

#### 4.11.6 Device and Access Protection
The system may support additional access protection controls, including:

- new-device verification
- suspicious-login detection
- device binding where configured
- app integrity checks where supported
- minimum supported app version enforcement
- geo or IP anomaly detection where configured
- remembered device model where permitted

#### 4.11.7 Push Notifications and Security Event Communication
The Mobile App shall support push notifications where configured.

This may include:

- transaction updates
- onboarding reminders
- document requests
- support updates
- security notifications
- service notices

The system shall also support notification of material security events to the customer where configured, including:

- new login
- password changed
- MFA changed
- suspicious login
- account locked
- profile-security change
- high-risk payment action

#### 4.11.8 Access Restriction Messaging
Where customer access is restricted due to onboarding, compliance, security, or operational reasons, the Mobile App shall display controlled messaging appropriate to the customer and the reason category permitted for disclosure.

### 4.12 Mobile App Audit, Traceability, and Customer-Facing Event History

The platform shall maintain traceability of material customer-facing actions taken through the Mobile App.

This shall include, as applicable:

- registration started and completed
- verification completed
- onboarding submitted
- document uploaded
- beneficiary created or changed
- quote accepted
- transaction initiated
- transaction confirmed
- profile updated
- password reset
- login event
- MFA event
- biometric enablement or disablement
- business-user invitation and approval actions where applicable

The event history shall be available for internal audit, customer servicing, security review, and dispute support in accordance with applicable permissions and retention rules.

## 5. Pangea Payment Rail

The Pangea Payment Rail shall be a secure public API layer through which approved aggregator clients, enterprise customers, and other authorised partners may consume Pangea Pay services.

The API shall expose controlled access to customer, beneficiary, account, wallet, FX, payment, remittance, transaction-tracking, and related platform capabilities, subject to product configuration, tenant entitlement, partner permissions, and applicable regulatory requirements.

The project scope shall also include modern HTML API documentation with endpoint definitions, request and response examples, authentication guidance, webhook guidance, status definitions, and error handling standards.

### 5.1 API Access Model and Consumer Types

The Pangea Payment Rail shall support controlled access by authorised external API consumers.

#### 5.1.1 API Consumer Types
The API shall support access for one or more of the following consumer types:

- aggregator clients
- enterprise customers
- institutional partners
- white-label partners
- internal trusted platform consumers where applicable

The available endpoint set, permissions, rate limits, and operational scope may vary by consumer type.

#### 5.1.2 Tenant and Environment Scope
The API shall support access by tenant and environment.

The access model shall support:

- production environment access
- non-production or sandbox access
- tenant-specific API consumers
- partner-specific API credentials
- environment-specific endpoint base URLs
- environment-specific credentials and secrets

The system shall ensure strict separation of consumer access between tenants and environments.

#### 5.1.3 Commercial and Product Entitlement Control
API access shall be subject to commercial entitlement and enabled product modules.

The system shall support access controls based on:

- contracted API products
- enabled transaction types
- enabled corridors
- enabled currencies
- enabled funding methods
- enabled payout methods
- enabled customer types
- enabled reporting or reconciliation features

The API shall reject requests for capabilities that are not enabled for the requesting API consumer.

### 5.2 Authentication, Authorisation, and Credential Management

The API shall support secure authentication, authorisation, and credential lifecycle management.

#### 5.2.1 Authentication Methods
The API shall support one or more secure authentication methods, which may include:

- client credentials flow
- API key with secret
- OAuth 2.0 access token model
- signed request model where configured
- mutual TLS where required for high-trust integrations

The chosen authentication model may vary by API consumer type, environment, or security policy.

#### 5.2.2 Credential Issuance and Management
The platform shall support controlled issuance and maintenance of API consumer credentials.

Credential management shall support:

- client identifier
- credential status
- credential issue date
- credential expiry date where applicable
- credential rotation support
- credential revocation
- environment-specific credentials
- multiple credentials per consumer where required
- support ownership metadata

#### 5.2.3 API Permissions and Scope Control
The API shall support scope-based or permission-based access control.

Permissions may be granted by endpoint group, function, product, or operational scope, including:

- customer creation
- customer lookup
- beneficiary management
- quote generation
- FX conversion
- balance inquiry
- virtual account inquiry
- payment initiation
- remittance initiation
- transaction status retrieval
- webhook management
- document submission
- reporting access

The API shall reject unauthorised calls with standardised error responses.

#### 5.2.4 IP and Access Restrictions
Where configured, the API shall support additional access restrictions, including:

- IP allowlisting
- source-country restriction
- mutual TLS enforcement
- environment-specific network restrictions
- time-based or temporary access disablement

#### 5.2.5 Authentication and Access Audit
The platform shall log material authentication and access events, including:

- successful token or credential use
- failed authentication attempt
- expired credential use
- revoked credential use
- blocked IP attempt
- permission-denied event
- credential rotation event

### 5.3 API Consumer and Partner Management

The platform shall support registration and controlled management of API consumers.

#### 5.3.1 API Consumer Record
Each API consumer record shall include, as applicable:

- API consumer reference
- legal name
- trading name
- tenant affiliation
- consumer type
- jurisdiction
- commercial status
- operational status
- supported environments
- contact details
- technical contact
- support contact
- webhook contact where applicable
- notes

#### 5.3.2 Consumer Status Lifecycle
The API consumer lifecycle shall support statuses such as:

- onboarding
- active
- suspended
- restricted
- terminated
- archived

The platform shall prevent API usage by inactive, suspended, or terminated consumers except where explicitly permitted for specific support purposes.

#### 5.3.3 Consumer-Specific Controls
The platform shall support consumer-specific configuration including:

- enabled endpoints
- enabled products
- rate limits
- corridor restrictions
- currency restrictions
- webhook eligibility
- reporting eligibility
- idempotency requirement
- retry policy expectations
- callback rules where applicable

#### 5.3.4 API Consumer Onboarding Workflow

The platform shall support a controlled onboarding workflow for API consumers.

The onboarding workflow may include:

- commercial approval
- technical contact setup
- consumer record creation
- environment allocation
- credential issuance
- IP allowlisting where applicable
- webhook setup where applicable
- endpoint entitlement setup
- sandbox access
- production readiness review
- production activation
- suspension or rollback where onboarding controls fail

The system shall maintain auditability of all material onboarding actions and approvals.

### 5.4 Customer and Identity API Services

The API shall support controlled customer and identity-related services where enabled.

#### 5.4.1 Customer Creation
The API may support creation of customer records for eligible customer types.

The customer-creation service may support:

- individual customer creation
- business customer creation
- customer-user creation where applicable
- registration reference return
- validation feedback
- duplicate detection response
- pending onboarding status return

The API shall validate mandatory fields, data format, and entitlement rules before creating a customer record.

#### 5.4.2 Customer Lookup and Retrieval
The API may support retrieval of customer information subject to permission and data-visibility controls.

Customer lookup may support:

- lookup by customer reference
- lookup by external reference
- lookup by partner reference
- retrieval of onboarding status
- retrieval of customer status
- retrieval of linked account summary where permitted

The API shall apply data minimisation and field-level visibility rules where appropriate.

#### 5.4.3 Customer Status Visibility
Where enabled, the API may provide customer-status information including:

- pending onboarding
- active
- restricted
- suspended
- rejected
- closed

The API response model shall use standardised status definitions.

#### 5.4.4 Customer User and Business Access Support
Where business-customer functionality is enabled, the API may support:

- customer-user creation
- user lookup
- user status retrieval
- account-right or role visibility where contractually permitted

### 5.5 Beneficiary and Counterparty API Services

The API shall support beneficiary and counterparty management services where enabled.

#### 5.5.1 Beneficiary Creation
The API may support creation of beneficiaries or counterparties for supported transaction types.

The service shall validate:

- required fields by payout method
- required fields by corridor
- required fields by currency
- supported beneficiary type
- data format
- eligibility rules
- duplication or similarity where applicable

#### 5.5.2 Beneficiary Update and Maintenance
The API may support:

- beneficiary update
- beneficiary deactivation
- beneficiary reactivation where permitted
- beneficiary lookup
- beneficiary list retrieval
- validation status retrieval

Updates to payout-critical information may trigger revalidation, reapproval, or screening as configured.

#### 5.5.3 Beneficiary Status and Eligibility
The API may return beneficiary-related status data including:

- active
- inactive
- pending validation
- restricted
- blocked
- under review

The API shall prevent use of ineligible beneficiaries in transaction-initiation requests.

### 5.6 Quote, Pricing, and FX API Services

The API shall support quote generation and FX-related services for enabled transaction and conversion journeys.

#### 5.6.1 Quote Generation
The API may support quote generation for:

- remittance transfer
- domestic payment where FX applies
- international payment
- wallet conversion
- account conversion
- other supported transaction types

A quote request may include:

- source currency
- destination currency
- send amount or receive amount
- payout method
- corridor
- beneficiary reference where required
- product type
- customer reference where required
- external reference where applicable

#### 5.6.2 Quote Response
A quote response may include:

- quote reference
- quote status
- source currency
- destination currency
- send amount
- receive amount
- fee amount
- applied exchange rate
- validity period
- product type
- payout method
- pricing timestamp
- customer or partner pricing identifier where applicable

#### 5.6.3 FX Conversion Requests
Where enabled, the API may support customer or partner-initiated FX conversion requests.

This may include:

- source account or balance reference
- destination currency
- amount
- linked quote reference where required
- conversion confirmation response
- conversion status
- conversion reference

#### 5.6.4 Quote Validity and Expiry Handling
The API shall enforce quote validity rules.

The platform shall support:

- expiry timestamp in quote response
- rejection of expired quote usage
- re-quote requirement
- standardised response codes for expiry or reprice scenarios

### 5.7 Wallet, Account, and Virtual Account API Services

The API shall support account-related services where the relevant modules are enabled.

#### 5.7.1 Wallet or Account Balance Inquiry
The API may support retrieval of wallet or account balance information.

Balance inquiry may include:

- account reference
- account status
- available balance
- reserved balance where applicable
- blocked balance where applicable
- currency
- multi-currency balance breakdown where applicable
- timestamp of balance state

#### 5.7.2 Wallet or Account Summary
Where enabled, the API may support retrieval of:

- account list
- product type
- account status
- supported currencies
- linked-customer summary
- available actions indicator where applicable

#### 5.7.3 Virtual Account Inquiry
Where the product model includes virtual accounts, the API may support inquiry of virtual account details.

The response may include:

- virtual account reference
- linked account reference
- currency
- status
- account number or masked account details where permitted
- routing details where permitted
- usage restrictions where applicable
- provider reference where permitted

#### 5.7.4 Inbound Funding Visibility
Where enabled, the API may support retrieval of inbound funding activity linked to a wallet, account, or virtual account.

### 5.8 Payment, Transfer, and Remittance API Services

The API shall support secure initiation and tracking of supported payment journeys.

#### 5.8.1 Supported Transaction Types
The API may support initiation of:

- remittance transfer
- domestic payment
- international payment
- wallet-to-wallet transfer
- account-to-account transfer
- withdrawal request where supported
- funding-linked transaction where configured

The exact set of available transaction types shall depend on consumer entitlement, product configuration, and regulatory scope.

#### 5.8.2 Transaction Initiation
The API may support transaction initiation using a structured request containing, as applicable:

- customer reference
- customer-user reference where relevant
- source account or wallet reference
- beneficiary or counterparty reference
- transaction type
- send currency
- receive currency
- send amount
- receive amount
- quote reference where required
- payout method
- funding method where applicable
- purpose or narrative where required
- external reference
- idempotency key

The platform shall validate eligibility, limits, beneficiary status, account status, quote status, and product entitlement before accepting the request.

#### 5.8.3 Transaction Response
A transaction-initiation response may include:

- transaction reference
- external reference echo
- current status
- accepted timestamp
- next-step status guidance
- quote linkage where applicable
- customer reference
- processing message where appropriate

#### 5.8.4 Business Approval and Pending States
Where business-customer workflows are enabled, the API may support transactions that enter a pending-approval or pending-release state.

The API may return statuses such as:

- accepted
- pending approval
- pending review
- awaiting funds
- queued
- rejected

#### 5.8.5 Transaction Status Retrieval
The API may support retrieval of current transaction status and, where permitted, transaction history.

This may include:

- current status
- status timestamp
- transaction type
- amount details
- funding status
- payout status
- refund status where applicable
- reversal status where applicable
- beneficiary summary
- failure reason or code where permitted
- internal-to-external status mapping where applicable

#### 5.8.6 Refund and Reversal Support
Where supported by product and operational design, the API may support:

- refund request submission
- refund status retrieval
- reversal request submission
- reversal status retrieval

Such functionality shall be subject to permission, status, and operational eligibility rules.

### 5.9 Document Submission and Information Request API Services

The API may support document and information exchange where contractually agreed and operationally enabled.

#### 5.9.1 Document Submission
The API may support submission of documents linked to:

- customer onboarding
- periodic review
- transaction support
- case support
- beneficiary validation where applicable

The service shall support:

- document type
- linked record reference
- file metadata
- upload status response
- validation response
- duplicate or replacement handling where applicable

#### 5.9.2 Information Request Handling
Where enabled, the API may support retrieval of outstanding information or document requests relevant to a customer or transaction.

The response may include:

- request reference
- request type
- due date
- status
- linked customer or transaction reference
- required action summary

### 5.10 Webhooks, Callbacks, and Event Delivery

The API shall support event-based outbound communication to authorised API consumers where enabled.

#### 5.10.1 Webhook Registration and Management
The platform may support registration and maintenance of webhook endpoints for authorised API consumers.

Webhook configuration may include:

- endpoint URL
- status
- subscribed event types
- secret reference
- retry policy
- signature or verification configuration
- environment scope

#### 5.10.2 Supported Event Types
Webhook or callback events may include:

- customer created
- onboarding status changed
- beneficiary status changed
- quote expired where applicable
- transaction status changed
- payment completed
- payment failed
- refund status changed
- virtual-account funding event
- document request raised
- security or access event where contractually permitted

#### 5.10.3 Webhook Delivery Behaviour
The system shall support controlled webhook delivery behaviour, including:

- event timestamp
- event reference
- event type
- payload structure
- retry on delivery failure
- duplicate-safe delivery expectations
- delivery status tracking
- disabled-endpoint handling after repeated failures where configured

#### 5.10.4 Webhook Security
The platform shall support secure webhook delivery through one or more controls such as:

- signature verification
- secret-based verification
- mutual TLS where configured
- IP allowlisting where applicable

### 5.11 Reporting and Reconciliation API Services

Where contractually agreed and product-enabled, the API may support reporting and reconciliation-oriented services.

#### 5.11.1 Reporting Endpoints
The API may support access to selected reporting data, such as:

- transaction report data
- status summary data
- funding report data
- beneficiary usage data
- fee summary data
- reconciliation summary data
- settlement summary data where permitted

#### 5.11.2 Reconciliation Support Endpoints
The API may support reconciliation-oriented access to:

- transaction reference mapping
- partner reference mapping
- payout reference mapping
- settlement reference mapping
- status history
- exception indicators where permitted

The level of reconciliation detail exposed shall depend on consumer entitlement and data-visibility rules.

### 5.12 API Standards, Error Handling, and Idempotency

The API shall follow a consistent and well-governed standards model across all endpoints.

#### 5.12.1 Request and Response Standards
The API shall support standardised request and response structures.

This shall include, as applicable:

- consistent field naming
- standardised reference identifiers
- consistent timestamp format
- standardised currency codes
- standardised country codes
- status and error-code consistency
- version-aware response format

#### 5.12.2 Validation and Error Handling
The API shall return standardised error responses for validation failures, permission failures, authentication failures, eligibility failures, processing errors, and unexpected exceptions.

Error handling shall support, as applicable:

- error code
- error message
- field-level validation detail where appropriate
- correlation reference
- retry guidance where appropriate
- idempotency conflict indication where relevant

#### 5.12.3 Idempotency Control
The API shall support idempotency for transaction-initiation and other relevant write operations.

The platform shall support:

- idempotency key submission
- replay detection
- safe repeat response behaviour
- conflict handling where request payload differs for the same key
- expiry or validity rules for idempotency records

#### 5.12.4 Versioning
The API shall support a governed, path-based versioning model.

As the default approach, API versions shall be exposed through the endpoint path, for example `/v1/`, unless an alternative versioning strategy is explicitly approved in architecture and API governance documentation.

The versioning framework shall support:

- clear distinction between breaking and non-breaking changes
- introduction of a new API version for breaking changes
- controlled enhancement of an existing supported version for non-breaking changes
- version visibility in API documentation
- version-specific changelog and release-note visibility
- deprecation notice process
- minimum deprecation notice period
- defined support period for deprecated versions
- migration guidance for API consumers

For the purpose of API governance:

- a **breaking change** shall include a change that can require an API consumer to modify its integration, request structure, response handling, authentication handling, field expectations, status handling, or error handling in order to continue operating correctly
- a **non-breaking change** shall include backward-compatible additions or improvements that do not require an API consumer to change an already compliant integration

The platform shall apply the following minimum API versioning rules:

- breaking changes shall require release of a new API version unless an exception is formally approved through product, architecture, and customer governance
- non-breaking changes may be introduced within an existing supported version subject to release governance and documentation update
- API consumers shall be given not less than 6 months’ notice before a version is formally deprecated, unless a shorter period is required due to security, legal, regulatory, or critical operational risk
- a deprecated API version shall normally remain supported for at least 12 months from the date of deprecation notice, unless otherwise required by security, legal, regulatory, or critical operational risk
- all affected API consumers shall be provided with migration guidance for supported replacement versions

The platform shall maintain an auditable record of API version releases, version deprecation notices, support timelines, and material version-policy exceptions.

### 5.13 Rate Limiting, Availability, and Operational Controls

The API shall support operational controls to protect service stability and partner integration quality.

#### 5.13.1 Rate Limiting
The platform shall support configurable rate limiting by API consumer, endpoint group, environment, or traffic class.

The system shall support:

- request-per-second or request-per-minute limits
- burst control
- different limits for sandbox and production
- endpoint-specific limits
- consumer-specific limits

#### 5.13.2 Availability and Maintenance Controls
The platform shall support controlled handling of maintenance windows, degraded service states, and emergency restrictions.

This may include:

- maintenance-mode response behaviour
- partial-service availability messaging
- route-specific disablement
- consumer-specific disablement
- status page or service-status integration where applicable

#### 5.13.3 Observability and Support Visibility
The platform shall support operational visibility for API health and partner support, including:

- request volume
- success rate
- failure rate
- latency trend
- authentication failures
- webhook delivery failures
- timeout volume
- consumer-level activity summary

### 5.14 API Documentation, Sandbox, and Developer Experience

The project scope shall include a modern developer-facing API documentation and testing experience.

#### 5.14.1 HTML API Documentation
The platform shall provide HTML-based API documentation covering:

- endpoint catalogue
- authentication methods
- request schemas
- response schemas
- field descriptions
- sample requests
- sample responses
- status definitions
- error-code definitions
- webhook guidance
- versioning guidance
- onboarding instructions for API consumers

#### 5.14.2 Sandbox Environment
Where offered, the platform shall provide a sandbox or non-production environment for API consumer testing.

The sandbox experience may support:

- separate credentials
- test data
- simulated statuses
- non-production webhook delivery
- test documentation
- environment-specific rate limits

#### 5.14.3 Developer Enablement
The platform may support additional developer experience features such as:

- onboarding guide
- integration checklist
- changelog
- release notes
- Postman collection or equivalent
- webhook testing guidance
- sample error scenarios

### 5.15 Payment Rail Audit, Reporting, and Traceability

The platform shall maintain a full audit trail for API-related operational and administrative activities.

#### 5.15.1 API Audit Scope
The audit framework shall capture, as applicable:

- credential issuance or rotation
- authentication events
- permission changes
- endpoint calls
- transaction-initiation calls
- webhook configuration changes
- webhook delivery attempts
- report-access events
- consumer status changes
- configuration changes affecting API consumers

#### 5.15.2 API Traceability
The platform shall support traceability between API activity and downstream operational records.

This shall include, as applicable:

- API request reference
- correlation reference
- idempotency key
- customer reference
- beneficiary reference
- transaction reference
- webhook event reference
- integration route reference
- ledger or settlement linkage where applicable

#### 5.15.3 Audit and Support Extraction
The platform shall support extraction of API-related evidence for operational support, reconciliation, dispute handling, audit, and regulatory review in accordance with applicable permission and retention rules.

## 6. Core Business Rules and Shared Platform Controls

The Pangea Pay suite shall apply a shared set of business rules and control logic across the Backoffice, Web App, Mobile App, and Pangea Payment Rail wherever the same customer, account, beneficiary, pricing, transaction, compliance, or operational event is processed.

The purpose of this section is to ensure that all channels operate with consistent business behaviour, eligibility outcomes, pricing treatment, status transitions, and control application unless an explicit, documented exception is approved.

### 6.1 Channel Consistency Principle

The platform shall maintain functional consistency across all supported customer-facing channels and integration channels.

#### 6.1.1 Shared Business Outcomes
Where the same business journey is supported through more than one channel, the platform shall apply the same core:

- eligibility rules
- validation logic
- pricing logic
- FX rules
- limit checks
- compliance checks
- status transitions
- restriction outcomes
- audit and traceability standards

This principle shall apply across, as relevant:

- Web App
- Mobile App
- Payment Rail API
- Backoffice-assisted operational actions

#### 6.1.2 Channel-Specific Experience Differences
The platform may support channel-specific differences only where these relate to:

- user interface and navigation
- device capability
- biometric capability
- push notification capability
- document capture method
- session handling method
- channel-appropriate customer messaging
- technical integration method

Such differences shall not create inconsistent business logic or conflicting customer outcomes unless explicitly approved as a product-specific exception.

#### 6.1.3 Shared Services Principle
The platform shall use a shared business-services layer, rules framework, or equivalent common logic wherever practical in order to maintain consistency across channels.

### 6.2 Customer, Onboarding, and Identity Rules

The platform shall apply shared customer and identity rules across all application channels.

#### 6.2.1 Customer Types
The platform shall support customer classification by type, including:

- individual customer
- business customer
- business customer user
- invited business customer user
- API-created customer where applicable

Customer type shall determine the applicable onboarding, account, access, and transaction rules.

#### 6.2.2 Mandatory Registration Controls
The platform shall require completion of mandatory registration and verification steps before the customer may access enabled account or transaction functionality.

Mandatory registration controls may include:

- verified email address
- verified mobile number where required
- accepted terms and conditions
- accepted privacy notice
- required declarations
- successful account activation

#### 6.2.3 KYC / KYB Requirement Rules
The platform shall determine the level of onboarding, KYC, or KYB required based on one or more factors, including:

- customer type
- product type
- geography
- transaction type
- risk category
- regulatory model
- delivery channel
- funding or payout method

The platform shall prevent unrestricted use of the suite until mandatory onboarding requirements are satisfied.

#### 6.2.4 Ongoing Review Triggers
The platform shall support ongoing review triggers for customers and related parties.

Triggers may include:

- periodic review due date
- document expiry
- change to customer details
- unusual activity
- sanctions or screening update
- risk-category change
- change in ownership or business information
- account dormancy followed by reactivation
- manual compliance review trigger

#### 6.2.5 Customer Status Rules
The platform shall use a controlled customer-status model.

Indicative customer statuses may include:

- draft
- pending verification
- pending onboarding
- pending information
- under review
- active
- restricted
- suspended
- rejected
- closed
- archived

The platform shall ensure that customer status directly influences permitted actions across all channels.

### 6.3 Customer User, Access, and Account-Right Rules

The platform shall apply consistent access-right rules for customer users, especially for business customer models.

#### 6.3.1 Business User Roles
Where business-customer functionality is enabled, the platform shall support configured customer-user roles such as:

- business owner
- administrator
- finance user
- operational user
- approver
- read-only user

#### 6.3.2 Account Rights
The platform shall support account-right controls determining:

- which user may view which account
- which user may initiate payments
- which user may approve payments
- which user may manage beneficiaries
- which user may view statements
- which user may manage other users

#### 6.3.3 Cross-Channel Enforcement
Customer-user rights and account-right decisions shall be enforced consistently across:

- Web App
- Mobile App
- API, where exposed
- Backoffice-assisted servicing actions

### 6.4 Product, Wallet, Account, and Virtual Account Rules

The platform shall apply shared rules governing product eligibility, account creation, balance handling, and virtual account assignment.

#### 6.4.1 Product Eligibility Rules
Eligibility for any product or service shall depend on one or more factors, including:

- tenant entitlement
- customer type
- jurisdiction
- onboarding status
- risk category
- account status
- enabled channel
- enabled corridor
- enabled currency

#### 6.4.2 Wallet and Account Status Rules
The platform shall use a controlled wallet and account lifecycle model.

Indicative statuses may include:

- pending creation
- pending activation
- active
- restricted
- suspended
- frozen
- dormant
- closing
- closed
- archived

The operational effect of account status shall be applied consistently across channels.

#### 6.4.3 Multi-Currency Balance Rules
For multi-currency products, the platform shall support:

- separate balance by currency
- available balance
- reserved balance
- blocked balance
- supported decimal precision
- currency enablement by product

The platform shall not allow use of a balance where the relevant funds are reserved, blocked, or otherwise unavailable.

#### 6.4.4 Virtual Account Assignment Rules
Where virtual accounts are enabled, the platform shall support assignment rules based on:

- customer
- product
- currency
- geography
- provider
- operating model
- one-to-one or one-to-many assignment model

The platform shall prevent customer display or operational use of virtual accounts that are inactive, restricted, or expired.

### 6.5 Beneficiary and Counterparty Rules

The platform shall apply shared beneficiary and counterparty rules across supported channels.

#### 6.5.1 Beneficiary Eligibility Rules
A beneficiary shall only be available for use if all relevant conditions are satisfied, including:

- active status
- successful validation
- supported payout method
- supported corridor
- supported currency
- no active restriction
- no unresolved blocking compliance condition

#### 6.5.2 Beneficiary Data Rules
Required beneficiary data shall vary by:

- payout method
- country
- corridor
- currency
- customer type
- transaction type

The platform shall enforce the same required-field and format rules across Web, Mobile, API, and Backoffice-assisted creation or update.

#### 6.5.3 Beneficiary Change Rules
Updates to payout-critical beneficiary details may require:

- revalidation
- reapproval
- rescreening
- temporary suspension from use
- customer confirmation or renewed submission flow

### 6.6 FX, Pricing, and Fee Rules

The platform shall apply shared FX and pricing rules to ensure consistent financial treatment across all channels.

#### 6.6.1 Quote Calculation Rules
Quote calculation shall be based on configured pricing logic, which may include:

- reference rate
- spread
- markup or markdown
- fixed fee
- percentage fee
- product-specific pricing
- corridor-specific pricing
- customer-segment pricing
- partner-specific pricing
- promotional pricing where enabled

#### 6.6.2 Quote Validity Rules
All quotes shall have a controlled validity period.

The platform shall support:

- quote expiry timestamp
- quote invalidation after expiry
- re-quote requirement where applicable
- prevention of stale-price execution
- tolerance or repricing rules only where explicitly configured

#### 6.6.3 Fee Rules
Fees may vary by:

- product
- transaction type
- corridor
- payout method
- funding method
- customer segment
- partner
- promotion
- tenant configuration

#### 6.6.4 FX Conversion Rules
FX conversion shall only be allowed where:

- the currency pair is supported
- the account or wallet is eligible
- the source balance is sufficient
- the customer is not restricted
- the relevant limits are not breached
- the quote is valid where required

### 6.7 Payment, Transfer, and Remittance Rules

The platform shall apply consistent transaction rules across all supported channels.

#### 6.7.1 Supported Transaction Types
Supported transaction types may include:

- remittance transfer
- domestic payment
- international payment
- wallet-to-wallet transfer
- account-to-account transfer
- funding transaction
- withdrawal transaction
- FX-conversion-linked transfer
- refund
- reversal

The transaction types available shall depend on product, entitlement, and operating model.

#### 6.7.2 Mandatory Transaction Validation
Before a transaction is accepted, the platform shall validate, as applicable:

- customer eligibility
- customer status
- onboarding completion
- account status
- sufficient balance or funding availability
- quote validity
- beneficiary status
- corridor availability
- payout-method availability
- funding-method availability
- transaction limits
- velocity rules
- compliance and fraud controls
- duplicate or replay controls
- product entitlement rules

#### 6.7.3 Transaction Status Model
The platform shall support a controlled lifecycle status model for transactions.

Indicative transaction statuses may include:

- draft
- pending customer action
- pending validation
- pending onboarding
- pending screening
- pending approval
- awaiting funds
- funded
- queued
- submitted
- in progress
- paid
- failed
- cancelled
- refunded
- reversed
- on hold
- under investigation
- archived

The platform shall preserve a historical record of transaction status progression.

#### 6.7.4 Refund and Reversal Rules
Refunds and reversals shall only be allowed where:

- the underlying transaction state permits the action
- the relevant operational route supports the action
- required approvals are obtained
- financial, compliance, and settlement implications are handled correctly

---

### 6.8 Limit, Threshold, and Velocity Rules

The platform shall support configurable limits and thresholds applied consistently across channels.

#### 6.8.1 Limit Types
Limits may include:

- per-transaction limit
- daily limit
- weekly limit
- monthly limit
- annual limit
- balance limit
- withdrawal limit
- conversion limit
- beneficiary-specific limit where applicable
- corridor-specific limit
- funding-method-specific limit
- payout-method-specific limit

#### 6.8.2 Limit Inputs
Limit decisions may depend on:

- customer type
- risk category
- product
- currency
- geography
- customer verification level
- account status
- historic transaction behaviour
- commercial or tenant configuration

#### 6.8.3 Override Rules
Where permitted, limit overrides shall require:

- appropriate permission
- reason capture
- approval workflow where configured
- full audit trail

---

### 6.9 Compliance, Fraud, and Restriction Rules

The platform shall apply shared compliance, fraud, and restriction rules across all channels and operational flows.

#### 6.9.1 Screening and Monitoring Rules
The platform shall support screening and monitoring for:

- customers
- customer users where relevant
- business-related parties
- beneficiaries
- transactions
- funding events
- withdrawals
- unusual account activity

#### 6.9.2 Restriction Outcomes
Compliance, fraud, or operational controls may result in one or more of the following outcomes:

- customer restriction
- account restriction
- account freeze
- beneficiary restriction
- transaction hold
- transaction rejection
- additional information request
- enhanced due diligence requirement
- escalation to case management
- external reporting support

#### 6.9.3 Disclosure Control
The customer-facing channels shall display restriction and review messaging in a controlled way, consistent with disclosure policy and operational suitability.

---

### 6.10 Document and Communication Rules

The platform shall apply shared rules for document handling, communications, and customer notifications.

#### 6.10.1 Mandatory Document Rules
Document requirements may depend on:

- customer type
- onboarding stage
- product
- country
- risk category
- periodic review cycle
- transaction type
- manual review requirement

#### 6.10.2 Document Status Rules
Indicative document statuses may include:

- uploaded
- pending review
- verified
- rejected
- expired
- superseded
- archived

#### 6.10.3 Communication Rules
The platform shall support communication through configured channels including:

- email
- SMS
- push notification
- in-app or web notification
- API webhook where applicable

#### 6.10.4 Mandatory Communications
Customers shall not be permitted to disable communications that are mandatory for:

- security
- regulatory disclosure
- onboarding completion
- material account restriction
- material transaction event
- critical service notice

---

### 6.11 Shared Error, Status, and Messaging Standards

The platform shall maintain consistent standards for statuses, error treatment, and customer-facing messaging.

#### 6.11.1 Shared Status Definitions
Where the same business object appears in multiple channels, the platform shall use a consistent underlying status model.

#### 6.11.2 Customer-Friendly Status Translation
Customer-facing channels may translate technical or internal statuses into simpler customer-facing wording, provided the underlying state remains consistent.

#### 6.11.3 Standard Error Categories
Errors shall be categorised consistently, including:

- validation error
- authentication error
- authorisation error
- eligibility error
- restriction error
- processing error
- partner or route error
- system error
- temporary availability error

#### 6.11.4 Correlation and Traceability
Material requests and events shall support traceability through shared references such as:

- customer reference
- account reference
- beneficiary reference
- quote reference
- transaction reference
- case reference
- integration reference
- correlation reference
- idempotency key where applicable

---

### 6.12 Shared Audit and Evidence Rules

The platform shall maintain a common audit and evidence standard across all channels.

#### 6.12.1 Audit Scope
Audit logging shall apply to material actions including:

- registration and onboarding events
- profile updates
- account servicing actions
- beneficiary changes
- quote acceptance
- transaction initiation
- approval actions
- compliance actions
- restriction actions
- document submission and review
- communication-preference changes
- security events
- API access and write actions
- configuration and override actions

#### 6.12.2 Audit Contents
Audit records shall capture, as applicable:

- action taken
- object affected
- old value and new value where applicable
- user or system actor
- date and time
- tenant and environment context
- reason where required
- approval details where applicable
- linked operational reference

#### 6.12.3 Evidence Extraction
The platform shall support evidence extraction for:

- customer servicing
- operational investigation
- reconciliation investigation
- compliance review
- internal audit
- external audit
- dispute handling
- regulatory inspection

### 6.13 Transaction Query and Dispute Handling Rules

The platform shall support controlled handling of transaction-related queries, investigations, and disputes raised by customers, business users, API consumers, partners, or internal teams.

#### 6.13.1 Query Sources
Queries may originate from:

- retail customers
- business customers
- customer users
- API consumers
- payout partners
- banking partners
- customer support teams
- operations teams
- compliance teams

#### 6.13.2 Query Types
Queries may include:

- transaction delay
- status mismatch
- beneficiary issue
- funding issue
- payout failure
- duplicate processing concern
- refund request
- reversal request
- incorrect amount concern
- missing transaction confirmation
- partner-side discrepancy
- account-crediting issue

#### 6.13.3 Query Handling Requirements
The platform shall support:

- query reference creation
- linked transaction reference
- linked customer or partner
- ownership assignment
- priority
- target response date
- notes and evidence
- escalation path
- linked reconciliation or case reference where applicable
- closure reason

#### 6.13.4 Audit and Traceability
The platform shall maintain traceability of transaction query handling, including status updates, ownership changes, investigation notes, and linked resolution actions.

## 7. Data Privacy, Retention, and Regulatory Obligations

Pangea Pay shall support data privacy, data governance, retention control, and regulatory-obligation management across all applications, deployment models, tenants, and operational workflows.

This section shall apply to the Backoffice, Web App, Mobile App, Pangea Payment Rail, shared platform services, supporting storage layers, integrations, logs, reports, and exported records.

The platform shall be designed to support regulated financial-service operations and therefore shall maintain appropriate controls for confidentiality, integrity, availability, traceability, retention, lawful processing, and controlled disclosure of information.

### 7.1 Data Governance Principles

The platform shall apply a consistent data-governance framework across all modules and channels.

#### 7.1.1 Lawful and Purpose-Bound Processing
The platform shall support processing of personal data, business data, transactional data, financial data, and operational data only for legitimate, documented, and permitted business purposes.

Such purposes may include:

- customer registration
- onboarding and identity verification
- account and wallet servicing
- payment and remittance processing
- fraud prevention
- AML / CTF monitoring
- safeguarding and treasury control
- settlement and reconciliation
- customer servicing
- contractual service delivery
- audit, control, and regulatory compliance
- support and incident management

#### 7.1.2 Data Minimisation
The platform shall support data minimisation principles.

This means the platform shall:

- only collect data required for the relevant purpose
- avoid unnecessary duplication of sensitive data
- restrict exposure of sensitive data to users and systems that do not need it
- support masked or partial-value display where full visibility is not necessary
- avoid unnecessary propagation of personal data to downstream systems

#### 7.1.3 Accuracy and Controlled Change
The platform shall support data-quality controls and controlled update processes.

The system shall support:

- reference-data controls
- standardised values where possible
- validation rules
- change history for material fields
- protected-field handling for compliance-sensitive attributes
- review or approval workflows for certain data corrections where required

#### 7.1.4 Confidentiality and Need-to-Know Access
The platform shall enforce access to data on a least-privilege and need-to-know basis.

This shall apply to:

- personal data
- business and UBO data
- financial data
- compliance data
- documents
- support records
- audit data
- commercial customer data
- API consumer data

### 7.2 Data Classification and Sensitivity

The platform shall support classification of data according to sensitivity and usage.

#### 7.2.1 Indicative Data Classes
The platform may classify data into categories such as:

- public or low-sensitivity reference data
- internal operational data
- confidential customer data
- sensitive personal data where applicable
- financial and ledger data
- compliance and investigation data
- restricted security data
- restricted commercial or contractual data

The exact classification model may be adapted to tenant, jurisdiction, contractual, or regulatory requirements.

#### 7.2.2 Sensitive Data Handling
Sensitive or restricted data shall be subject to enhanced controls.

This may include:

- masked display
- restricted export
- restricted document download
- limited audit visibility
- special approval for access
- secure storage controls
- tighter retention and deletion controls where allowed
- higher logging and monitoring of access events

### 7.3 Personal Data and Business Data Scope

The platform shall support processing of both personal and non-personal regulated business data.

#### 7.3.1 Personal Data
Personal data processed by the platform may include:

- customer identity data
- contact data
- address data
- date of birth
- nationality
- account and wallet data linked to a person
- transaction data linked to a person
- document data
- authentication and access data
- customer support interactions
- behavioural and security-event data where applicable

#### 7.3.2 Business and Corporate Data
Business-related data processed by the platform may include:

- company identity data
- registration data
- ownership data
- director, shareholder, and UBO data
- authorised representative data
- account and transaction data
- contractual data
- commercial and support records

#### 7.3.3 Compliance and Investigative Data
The platform shall support processing of compliance and investigative data, including:

- screening outcomes
- alert data
- case data
- restriction data
- reporting-support data
- evidence files
- review notes
- escalation records

Access to such data shall be tightly controlled.

### 7.4 Data Residency, Segregation, and Deployment Model Considerations

The platform shall support data-control requirements arising from SaaS, hosted, licensed, or outright deployment models.

#### 7.4.1 Tenant Segregation
Where the platform operates in a multi-tenant model, it shall maintain segregation of tenant data through application, database, storage, access-control, and operational controls.

The platform shall prevent unauthorised access to one tenant’s data by another tenant or API consumer.

#### 7.4.2 Environment Segregation
The platform shall maintain separation between production and non-production environments.

Non-production environments shall not expose live production data unless explicitly authorised and appropriately controlled for support, migration, or testing purposes.

#### 7.4.3 Data Residency Support
Where contractually or regulatorily required, the platform should support controlled deployment or storage patterns that help meet data-residency or jurisdiction-specific hosting expectations.

#### 7.4.4 White-Label and Customer-Specific Isolation
Where the platform is provided on a white-label, dedicated-tenant, or licensed basis, the platform shall support customer-specific access, branding, and operational isolation without compromising shared security and governance standards.

#### 7.4.5 Dedicated Environment and Database Principle
As a core data-security and client-isolation principle, the platform shall support a dedicated application environment and dedicated database for each Pangea Suite customer, regardless of whether the commercial delivery model is described as SaaS, hosted, licensed, or outright transfer.

This principle is intended to support:

- stronger customer-data isolation
- reduced cross-client exposure risk
- clearer security boundaries
- simpler audit and assurance positioning
- customer-specific infrastructure control where required
- client-specific backup, retention, and recovery management
- customer-specific performance and scaling control
- improved support for regulated financial-services operating models

Shared control-plane services, shared deployment tooling, shared monitoring tooling, or other shared management components may still be used where appropriate, provided they do not compromise customer-data isolation or access-control boundaries.

### 7.5 Consent, Notices, and Lawful Basis Support

The platform shall support capture and retention of customer acknowledgements, declarations, and consent records where required.

#### 7.5.1 Notice Acceptance
The platform shall support recording of acceptance of:

- terms and conditions
- privacy notice
- electronic communication terms
- product-specific declarations
- relevant regulatory disclosures

The platform shall retain:

- version accepted
- date and time accepted
- customer or user reference
- channel of acceptance

#### 7.5.2 Marketing Preferences
Where marketing communication is supported, the platform shall support recording of customer preferences and opt-in or opt-out state in accordance with applicable law and policy.

#### 7.5.3 Operational vs Non-Optional Communications
The platform shall distinguish between:

- mandatory communications required for security, regulation, service delivery, or material account events
- optional communications such as marketing or selected informational notices

The platform shall not allow a customer to opt out of mandatory communications that must be delivered.

### 7.6 Data Retention Framework

The platform shall support a configurable and policy-driven data-retention framework.

Retention rules shall take into account:

- business need
- contractual obligations
- financial-recordkeeping requirements
- AML / CTF obligations
- audit requirements
- dispute and litigation needs
- data-protection obligations
- regulatory inspection requirements
- local law in the relevant jurisdiction

#### 7.6.1 Retention by Record Category
The platform shall support retention rules by record category, which may include:

- customer profile records
- customer-user records
- onboarding and verification records
- beneficiary records
- wallet and account records
- virtual account records
- transaction records
- ledger and accounting records
- treasury and safeguarding records
- settlement and reconciliation records
- compliance alerts and cases
- SAR / STR support records
- documents
- communications
- support tickets or service requests
- audit logs
- API logs
- report-run history
- commercial and contractual records

#### 7.6.2 Retention States
The platform shall support lifecycle states relevant to retention, including:

- active
- inactive
- archived
- retention-expired
- legal-hold
- deletion-pending
- purged

#### 7.6.3 Archive Controls
The platform shall support archival of records that are no longer operationally active but must remain available for control, audit, or regulatory purposes.

Archived records shall remain searchable or retrievable by authorised users subject to permission controls.

### 7.7 Deletion, Erasure, and Restriction Handling

The platform shall support controlled deletion, erasure, suppression, or restriction handling consistent with legal and regulatory obligations.

#### 7.7.1 No Uncontrolled Deletion of Regulated Records
The platform shall not permit uncontrolled deletion of records that are required for:

- financial recordkeeping
- AML / CTF compliance
- safeguarding or reconciliation evidence
- dispute handling
- internal or external audit
- regulatory reporting
- security investigation
- contractual enforcement

#### 7.7.2 Erasure Request Handling
Where data-protection law gives rise to erasure or deletion requests, the platform should support operational handling of such requests, subject to lawful exceptions.

The platform may support:

- request logging
- review status
- legal-basis review
- exemption or refusal reason
- suppression or restriction outcome
- anonymisation where legally and operationally appropriate
- decision audit trail

#### 7.7.3 Anonymisation and Pseudonymisation
Where records cannot be deleted due to regulatory or financial obligations, the platform may support anonymisation, pseudonymisation, or restricted-display controls where consistent with legal obligations and operational integrity.

### 7.8 Audit Logs, Access Logs, and Evidence Retention

The platform shall retain audit and operational logs sufficient to support investigation, evidence extraction, and control review.

#### 7.8.1 Audit Log Categories
The platform shall support retention of logs relating to:

- authentication events
- security events
- profile and customer changes
- account and beneficiary changes
- transaction activity
- approval actions
- compliance actions
- manual financial postings
- document access and document review
- report export
- API access and API write actions
- integration configuration changes
- commercial and subscription administration actions

#### 7.8.2 Access Logging for Restricted Data
The platform shall log material access to restricted or sensitive data where appropriate, including:

- compliance case access
- restricted document access
- security-configuration access
- manual adjustment activity
- sensitive report export
- credential-management access

#### 7.8.3 Log Retention Rules
Log retention periods shall be configurable and aligned to operational, security, contractual, and regulatory requirements.

### 7.9 Document Retention and Evidence Preservation

The platform shall support controlled retention of uploaded, generated, and received documents.

#### 7.9.1 Document Categories
Document-retention rules shall support categories such as:

- KYC / KYB documents
- source-of-funds evidence
- source-of-wealth evidence
- transaction support documents
- compliance evidence
- customer communications with attachments
- legal agreements
- commercial records
- internal review notes and attachments

#### 7.9.2 Superseded and Expired Documents
The platform shall support retention of superseded, expired, and replaced documents where required for audit, investigation, or evidential continuity.

#### 7.9.3 Evidence Preservation
Where a legal hold, investigation hold, audit requirement, or regulatory review applies, the platform shall support preservation of relevant records and documents beyond standard retention timelines.

### 7.10 Regulatory Recordkeeping Obligations

The platform shall support recordkeeping requirements commonly associated with regulated payment, remittance, wallet, and financial-crime-control operations.

#### 7.10.1 Financial and Transaction Recordkeeping
The platform shall retain financial and transaction records sufficient to support:

- transaction reconstruction
- customer servicing
- reconciliation
- safeguarding review
- treasury review
- settlement review
- dispute resolution
- audit
- regulatory inspection

#### 7.10.2 AML / CTF and Screening Recordkeeping
The platform shall retain records sufficient to support:

- customer due diligence evidence
- screening evidence
- alert and case history
- decision rationale
- control actions applied
- reporting-support records
- periodic review evidence

#### 7.10.3 Audit and Governance Recordkeeping
The platform shall retain governance and control records sufficient to support:

- role and permission changes
- policy-related configuration changes
- feature and operational control changes
- approval history
- manual override history
- access-control evidence
- report and evidence extraction history

### 7.11 Data Subject, Customer, and Partner Rights Support

The platform should support operational workflows for managing lawful rights and requests relating to data.

#### 7.11.1 Supported Request Types
Where applicable, the platform may support workflows for:

- access request
- correction request
- restricted-change request
- communication preference update
- erasure request review
- objection or restriction request where applicable

#### 7.11.2 Request Traceability
The platform shall support traceability of such requests through:

- request reference
- request type
- submission date
- linked customer or data subject
- status
- assigned owner
- decision date
- outcome
- rationale
- supporting evidence

#### 7.11.3 Partner and API Consumer Data Requests
Where relevant, the platform should also support controlled handling of data-related requests raised by API consumers, institutional customers, or other authorised partners in line with contractual and legal obligations.

### 7.12 Cross-Border Data Sharing and Third-Party Disclosure Controls

The platform shall support controlled disclosure and data sharing with third parties where required for service delivery, legal compliance, or support purposes.

#### 7.12.1 Permitted Third-Party Sharing
The platform may support data sharing with:

- banking partners
- payout partners
- payment gateways
- compliance and screening providers
- messaging providers
- hosting or infrastructure providers
- authorised support providers
- regulators or competent authorities where required
- institutional customers using the suite, within their entitled data scope

#### 7.12.2 Data Sharing Controls
Data sharing shall be controlled through:

- purpose limitation
- minimum necessary disclosure
- field-level or dataset-level restriction
- secure transport
- access controls
- audit logging
- contractual or configured access boundaries

#### 7.12.3 Cross-Border Transfer Considerations
Where data is transferred across borders, the platform and operating model should support appropriate legal, contractual, and technical safeguards as required by the relevant jurisdictions and deployment model.

### 7.13 Security and Privacy-by-Design Obligations

The platform shall support privacy and security by design across all applications and services.

#### 7.13.1 Privacy-by-Design
The platform should support privacy-by-design measures including:

- minimum necessary data collection
- field masking
- secure defaults
- controlled export
- role-based visibility
- environment segregation
- support for lawful retention and deletion controls
- auditability of sensitive actions

#### 7.13.2 Security Control Alignment
The privacy and data-governance framework shall align with platform security controls including:

- encryption in transit
- encryption at rest
- secure authentication
- MFA where applicable
- secure credential handling
- privileged-access control
- security logging
- monitoring and alerting

#### 7.13.3 Non-Production Data Controls
The platform should support controls to reduce unnecessary use of live sensitive data in non-production environments, including masking, synthetic data, restricted restoration, or approved support-only handling where needed.

### 7.14 Reporting, Audit, and Compliance Evidence

The platform shall support reporting and evidence extraction relevant to privacy, retention, and regulatory obligations.

#### 7.14.1 Compliance Reporting Support
The platform may provide reporting on:

- expiring documents
- overdue reviews
- retention-expired records
- archived records
- deletion-pending records
- legal-hold records
- restricted-data access events
- audit-log activity
- report-export history
- unresolved privacy or data requests

#### 7.14.2 Evidence Extraction
The platform shall support extraction of records and evidence for:

- internal compliance review
- operational investigation
- external audit
- regulatory inspection
- legal review
- customer dispute handling
- data-rights request handling

#### 7.14.3 Audit of Privacy and Retention Actions
The platform shall maintain an audit trail for material privacy, retention, access-control, disclosure, deletion, anonymisation, archival, and legal-hold actions.

Audit records shall capture, as applicable:

- action taken
- record category affected
- actor
- date and time
- old value and new value where applicable
- reason for action
- approval details where applicable
- tenant and environment context

### 7.15 Policy Configuration and Governance Administration

The platform shall support controlled administration of privacy, retention, and related governance settings where such settings are configurable within the suite.

#### 7.15.1 Policy Administration Scope
This may include configuration or controlled storage of:

- retention periods by record type
- archive rules
- purge eligibility rules
- legal-hold flags
- export restrictions
- masking rules
- restricted-access categories
- communication-preference rules
- disclosure control categories

#### 7.15.2 Approval and Change Control
Material changes to privacy, retention, or governance configurations shall be subject to:

- permission control
- maker-checker approval where required
- effective-date management where applicable
- full audit logging

#### 7.15.3 Governance Responsibility
The platform shall support clear operational ownership of privacy, retention, and regulatory-governance controls through role-based access, auditability, and evidence extraction.

## 8. Disaster Recovery and Business Continuity Requirements

Pangea Pay shall support business continuity, operational resilience, disaster recovery, and service restoration capabilities across all in-scope applications, platform services, integrations, data stores, and operational processes.

This section shall apply to:

- Pangea Backoffice
- Pangea Web App
- Pangea Mobile App
- Pangea Payment Rail
- shared backend services
- databases and replicas
- storage services
- messaging and queueing services
- integration services
- monitoring and alerting services
- supporting infrastructure
- operational support and incident-management processes

The platform shall be designed to minimise service disruption, preserve critical records, support orderly recovery, and maintain control over customer, transaction, financial, compliance, and audit data during and after operational incidents.

### 8.1 Resilience and Continuity Objectives

The platform shall support resilience objectives appropriate to a regulated payments and financial-services platform.

#### 8.1.1 Core Continuity Principles
The continuity design shall aim to:

- reduce the probability of critical service interruption
- minimise the duration of disruption when incidents occur
- protect customer, financial, compliance, and audit data
- preserve transaction traceability and financial integrity
- support controlled degradation where full service is unavailable
- restore services in a prioritised and auditable manner
- maintain customer and partner communication during disruption
- support internal and external incident coordination

#### 8.1.2 Critical Service Prioritisation
The platform shall support prioritisation of recovery based on service criticality.

Indicative critical services may include:

- customer authentication
- customer onboarding status visibility
- wallet and account balance visibility
- payment and remittance processing
- transaction status visibility
- treasury and safeguarding visibility
- compliance and case-management access
- ledger and financial record integrity
- API transaction processing
- document access required for operational or compliance review
- operational monitoring and incident management

#### 8.1.3 Continuity by Deployment Model
The platform shall support continuity requirements appropriate to the applicable deployment model, including:

- multi-tenant SaaS deployment
- single-tenant hosted deployment
- licensed deployment
- transition-period support for outright commercial transfer where agreed

The continuity design may vary by commercial model, but the required governance, evidence, and recovery discipline shall remain controlled and documented.

### 8.2 Business Continuity Planning Framework

The platform and operating model shall support a documented business continuity planning framework.

#### 8.2.1 Business Continuity Plan Scope
The business continuity framework shall address, as applicable:

- application outage
- infrastructure outage
- database failure
- storage failure
- region or hosting outage
- network disruption
- third-party integration outage
- messaging-provider outage
- KYC or screening-provider outage
- banking or payout-partner disruption
- cyber incident
- operational staff unavailability
- data corruption event
- major security event
- planned maintenance with continuity impact

#### 8.2.2 Continuity Procedures
Continuity procedures shall support, as applicable:

- incident detection
- service classification
- escalation
- internal communications
- customer communications
- partner communications
- temporary workaround activation
- degraded-mode operation
- manual fallback processing where approved
- service restoration
- post-incident review

#### 8.2.3 Ownership and Accountability
The continuity framework shall support defined ownership for:

- incident leadership
- technical recovery
- database recovery
- application recovery
- treasury and finance operations
- compliance oversight during incident handling
- partner coordination
- customer communication
- executive escalation
- post-incident reporting

### 8.3 Recovery Objectives

The platform shall support documented recovery objectives for critical systems and data sets.

#### 8.3.1 Recovery Time Objective (RTO)
The platform should support defined Recovery Time Objectives for critical services.

RTOs shall be established by service category and may differentiate between:

- customer-facing services
- operational Backoffice services
- financial-control services
- compliance services
- reporting services
- support services
- non-production services

The final RTO values may be defined in operating policy, contractual schedules, or environment-specific standards.

#### 8.3.2 Recovery Point Objective (RPO)
The platform should support defined Recovery Point Objectives for critical data domains.

RPOs shall be considered for:

- customer and onboarding data
- account and balance data
- transaction data
- ledger and journal data
- treasury and safeguarding data
- compliance and case data
- documents
- audit logs
- API request and webhook records

The platform shall aim to minimise data loss and ensure recoverability appropriate to the record type and operational criticality.

#### 8.3.3 Service Tiering
The platform should classify services into recovery tiers, for example:

- critical immediate-recovery services
- high-priority controlled-recovery services
- standard recovery services
- deferred non-critical services

Recovery procedures shall prioritise services in accordance with their assigned tier.

### 8.4 High Availability and Fault Tolerance

The platform should support high availability and fault-tolerance patterns for critical services.

#### 8.4.1 Application Resilience
Critical application components should support:

- redundant instances where appropriate
- controlled failover
- stateless application design where practical
- graceful restart
- horizontal scaling where appropriate
- health-check-driven traffic routing

#### 8.4.2 Database Resilience
Critical data services should support resilience measures such as:

- primary database protection
- replica or standby capability
- controlled failover procedures
- backup integrity validation
- transaction-consistency protection
- restoration procedures with auditability

#### 8.4.3 Storage Resilience
Document and object storage components should support:

- durable storage design
- access control continuity
- backup or replication strategy
- recovery of critical documents and generated outputs
- integrity validation

#### 8.4.4 Queue and Messaging Resilience
Queueing and asynchronous processing components should support:

- durable message handling
- retry behaviour
- replay safety
- dead-letter or exception handling
- controlled restart after disruption
- prevention of duplicate financial processing where applicable

### 8.5 Backup, Restore, and Recovery Controls

The platform shall support backup and restoration controls sufficient to protect critical data and support recovery.

#### 8.5.1 Backup Scope
The backup strategy shall cover, as applicable:

- operational databases
- replicas or standby data
- document storage
- configuration data
- integration mappings
- report definitions
- audit logs
- API-related records
- commercial and subscription records where relevant
- infrastructure configuration where applicable

#### 8.5.2 Backup Frequency and Retention
Backup frequency and retention shall be defined according to record criticality, change rate, recovery objectives, and regulatory requirements.

The platform shall support documented backup schedules for:

- transactional data
- ledger and financial data
- customer and compliance data
- documents
- application and configuration metadata

#### 8.5.3 Backup Security
Backups shall be protected through appropriate controls, which may include:

- encryption at rest
- access restriction
- segregation from production access paths
- controlled restore permissions
- audit logging of restore events
- backup integrity checking

#### 8.5.4 Restore Validation
The platform shall support controlled testing and validation of restore procedures.

Restore validation shall aim to confirm:

- backup usability
- data integrity after restore
- recoverability of critical applications
- recoverability of documents
- recoverability of audit and control records
- consistency between operational and financial records

### 8.6 Data Integrity and Financial Continuity Controls

The platform shall support continuity controls that protect financial and operational integrity during service disruption and recovery.

#### 8.6.1 Ledger Integrity
The platform shall preserve the integrity of ledger and journal records during failure and recovery scenarios.

The recovery process shall not permit silent loss, uncontrolled overwrite, or unaudited alteration of posted financial records.

#### 8.6.2 Transaction Reconstruction
The platform shall support reconstruction of transaction history and status progression following an incident.

This shall include, as applicable:

- transaction reference
- status history
- partner interaction history
- funding and payout events
- reconciliation linkage
- related ledger postings
- customer-facing confirmation state

#### 8.6.3 Duplicate-Processing Prevention
Recovery procedures shall include controls to reduce the risk of duplicate financial processing after restart, replay, or failover.

This may include:

- idempotency controls
- safe retry design
- duplicate detection
- queue replay controls
- integration reconciliation checks
- manual recovery approval where needed

#### 8.6.4 Balance and Safeguarding Continuity
The platform shall support recovery procedures that preserve or re-establish:

- account balance integrity
- reserved and blocked balance integrity
- safeguarding visibility
- treasury position visibility
- prefunding visibility
- outstanding settlement visibility

### 8.7 Third-Party Dependency Continuity

The platform shall support continuity planning for outages or degradation affecting external providers and partners.

#### 8.7.1 Third-Party Categories
Continuity planning shall consider dependencies such as:

- banking partners
- payout partners
- payment gateways
- KYC and identity providers
- screening providers
- messaging providers
- cloud or infrastructure providers
- authentication providers
- open banking providers
- virtual account providers

#### 8.7.2 Dependency Outage Handling
The platform should support one or more continuity responses where appropriate, including:

- failover to alternate provider
- route disablement
- transaction queuing
- customer-facing service warning
- temporary feature restriction
- manual referral process
- delayed processing with traceability
- suspension of selected corridors or payout methods

#### 8.7.3 Third-Party Incident Visibility
The platform should provide operational visibility of external dependency status where available, including:

- provider outage state
- degraded response state
- failed request trends
- callback failure trends
- partner-specific route disablement
- recovery confirmation

### 8.8 Degraded Mode and Manual Fallback Operations

The platform shall support controlled degraded-mode operation where full functionality is not available.

#### 8.8.1 Degraded Service Principles
When full service is unavailable, the platform should support continuation of selected critical capabilities with reduced functionality where safe and operationally appropriate.

This may include:

- read-only access for selected modules
- delayed transaction submission
- delayed status update
- temporary disablement of high-risk actions
- queueing for later processing
- temporary suspension of specific routes or products

#### 8.8.2 Manual Fallback Controls
Where manual fallback is permitted, the platform and operating procedures shall support controlled manual handling for selected scenarios.

Manual fallback may include:

- manual transaction review
- manual partner coordination
- manual safeguarding review
- manual treasury monitoring
- manual communication processes
- manual incident recordkeeping

All manual fallback actions shall remain subject to approval, reconciliation, and audit requirements.

#### 8.8.3 Feature and Operational Control Use During Incident
The platform shall support use of operational controls and feature flags during incident handling to:

- suspend transaction initiation
- disable specific corridors
- disable specific providers
- place modules into maintenance mode
- restrict onboarding
- disable selected customer journeys
- switch to degraded-mode behaviour

### 8.9 Incident Detection, Escalation, and Response

The platform and operating model shall support timely detection and controlled response to major incidents.

#### 8.9.1 Monitoring and Alerting
The platform shall support monitoring and alerting for critical failure conditions, including:

- application unavailability
- abnormal error rate
- latency degradation
- authentication failures
- database health issues
- failed background jobs
- queue backlog or message failure
- integration outage
- webhook failure
- storage access issue
- backup failure
- suspicious operational event

#### 8.9.2 Incident Classification
The operating model should support classification of incidents by severity and impact, taking into account:

- customer impact
- financial impact
- compliance impact
- data-integrity impact
- duration
- geographic or tenant scope
- affected products or channels

#### 8.9.3 Escalation Procedures
The incident framework shall support escalation to:

- support teams
- engineering teams
- security teams
- treasury or finance teams
- compliance teams
- customer-service teams
- commercial account teams where relevant
- executive leadership where severity requires

#### 8.9.4 Incident Recordkeeping
The platform or operating process shall support a record of major incidents including:

- incident reference
- start time
- affected services
- affected tenants or consumers
- severity
- incident owner
- actions taken
- communications issued
- recovery time
- closure status
- post-incident findings

### 8.10 Customer, Partner, and Stakeholder Communications During Incidents

The platform and operating model shall support controlled communications during service disruption.

#### 8.10.1 Customer Communications
The platform shall support communication to affected customers where appropriate regarding:

- service disruption
- delayed processing
- temporary unavailability
- restricted feature availability
- required customer action
- recovery confirmation

#### 8.10.2 Partner and API Consumer Communications
The operating model shall support communication with:

- payout partners
- banking partners
- API consumers
- institutional customers
- white-label customers
- service providers

Communication may include outage notice, workaround guidance, degraded-mode guidance, and restoration confirmation.

#### 8.10.3 Communication Governance
Incident communications shall be controlled to ensure:

- accuracy
- consistency
- appropriate approval
- suitable disclosure
- auditability of material communications

### 8.11 Disaster Recovery Testing and Exercising

The platform and operating model shall support regular testing of continuity and recovery arrangements.

#### 8.11.1 Test Scope
Testing may include:

- backup restore test
- database failover test
- application recovery test
- storage recovery test
- integration outage simulation
- queue recovery test
- credential or secret recovery test
- region or environment recovery scenario
- major incident tabletop exercise
- business continuity walkthrough

#### 8.11.2 Test Frequency
Recovery and continuity testing shall be performed at defined intervals based on risk, criticality, contractual obligations, and operational policy.

#### 8.11.3 Test Evidence and Outcomes
Testing shall produce evidence including:

- test reference
- scenario description
- systems in scope
- recovery outcome
- issues identified
- target improvements
- responsible owner
- remediation status

#### 8.11.4 Remediation Tracking
Weaknesses identified during continuity or recovery testing shall be tracked to remediation with ownership and follow-up.

### 8.12 Disaster Recovery Environment and Restoration Governance

The platform should support a controlled disaster recovery environment or restoration strategy appropriate to the deployment model.

#### 8.12.1 Recovery Environment Readiness
The recovery strategy should support the ability to restore critical services into an environment capable of supporting prioritised operations.

#### 8.12.2 Configuration Recovery
The recovery process shall support restoration of:

- application configuration
- security configuration
- integration configuration
- route configuration
- report definitions
- feature flags and operational controls
- tenant configuration
- commercial configuration where relevant

#### 8.12.3 Controlled Promotion Back to Normal Operations
Following recovery or failover, the platform shall support controlled return to normal operations.

This shall include, as applicable:

- recovery validation
- financial and transaction reconciliation
- queue clearance validation
- integration re-enablement
- customer and partner communication
- approval to resume restricted activities
- post-incident review initiation

### 8.13 Security Incident and Cyber Recovery Considerations

The platform shall support continuity and recovery measures appropriate to cyber incidents and security-related disruptions.

#### 8.13.1 Security Event Containment
Where a security incident occurs, the operating model shall support controlled containment, which may include:

- access restriction
- credential revocation
- forced logout
- environment isolation
- route suspension
- temporary disablement of selected features
- enhanced monitoring

#### 8.13.2 Recovery After Security Incident
Recovery following a security event shall support:

- integrity verification
- credential rotation where required
- access restoration
- validation of financial and operational records
- restoration of integrations
- communication to affected stakeholders where required
- evidence preservation for investigation

#### 8.13.3 Security Incident Recordkeeping
Cyber and security-related recovery actions shall remain auditable and aligned to the platform’s broader audit, privacy, and incident-governance requirements.

### 8.14 Audit, Evidence, and Regulatory Support

The platform shall support evidence extraction and auditability of continuity and recovery activities.

#### 8.14.1 Recovery Auditability
The platform or operating model shall maintain records of:

- failover events
- restore events
- backup operations
- recovery actions
- major incident actions
- operational control changes used during incident response
- recovery approvals
- post-incident decisions

#### 8.14.2 Regulatory and Audit Evidence
The platform shall support production of evidence for:

- internal audit
- external audit
- customer assurance
- operational review
- compliance review
- regulatory inspection
- contractual review where required

#### 8.14.3 Post-Incident Review Support
The operating model shall support post-incident review, including:

- incident timeline reconstruction
- root-cause analysis support
- control-effectiveness review
- customer-impact assessment
- financial-impact assessment
- remediation planning
- lessons learned capture

### 8.15 Governance, Approval, and Change Control

Business continuity and disaster recovery arrangements shall be governed through controlled ownership and change management.

#### 8.15.1 Policy and Procedure Governance
The platform operator shall maintain governance over:

- disaster recovery procedures
- business continuity procedures
- recovery priorities
- communication procedures
- backup schedules
- restore permissions
- testing plans
- escalation contacts

#### 8.15.2 Approval Controls
Material changes to disaster recovery or business continuity configurations shall be subject to:

- role-based permission control
- maker-checker approval where required
- change record creation
- audit logging
- documented effective date where applicable

#### 8.15.3 Cross-Functional Governance
The continuity framework shall support coordinated governance across:

- technology
- operations
- treasury and finance
- compliance
- customer support
- commercial account management where relevant
- executive oversight

## 9. Solution Architecture Summary

The preferred solution design for Pangea Pay is a modular application suite consisting of dedicated customer environments, shared platform management capabilities, and reusable core business services.

The architecture shall support regulated financial-service operations, multi-application delivery, dedicated institutional-customer isolation, configurable product enablement, and controlled integration with third-party providers.

### 9.1 Architectural Principles

The solution architecture shall be based on the following principles:

- modular service design
- strong customer-data isolation
- shared core business logic across channels
- secure-by-default controls
- configuration-driven operation wherever practical
- auditability and traceability of material actions
- high availability for critical services
- recoverability and operational resilience
- controlled integration with external providers
- scalability by service domain, tenant, and workload type

### 9.2 Core Application Components

The Pangea Pay suite shall consist of the following major application components:

- Pangea Commercial Management Portal
- Pangea Backoffice
- Pangea Web App
- Pangea Mobile App for iOS
- Pangea Mobile App for Android
- Pangea Payment Rail
- shared backend business services
- shared integration and orchestration services
- shared reporting, audit, and monitoring services

### 9.3 Dedicated Customer Environment Model

Pangea Pay shall be architected on the basis that each institutional customer operates within a dedicated technical environment and dedicated database boundary, regardless of the agreed commercial delivery model, unless an explicitly approved exception is documented.

Each institutional customer environment shall, as applicable, include:

- dedicated application deployment context
- dedicated operational database
- dedicated customer data storage boundary
- customer-specific configuration
- customer-specific integration configuration
- customer-specific access-control scope
- customer-specific backup and recovery scope

This model is intended to support:

- stronger data isolation
- clearer client security boundaries
- improved audit and assurance positioning
- customer-specific scaling and performance control
- customer-specific backup, retention, and recovery management
- improved support for regulated operating models

### 9.4 Shared Platform and Control-Plane Components

The architecture may include shared platform-management and engineering components, provided they do not compromise institutional-customer data isolation.

These shared components may include:

- CI/CD tooling
- monitoring and observability tooling
- deployment automation
- logging and alerting framework
- secrets-management framework
- support tooling
- shared commercial-management services
- shared feature and release management controls

### 9.5 Core Business Services Layer

The platform shall use a shared business-services layer to support consistent logic across Backoffice, Web App, Mobile App, and Payment Rail.

The shared services layer may include:

- customer and identity services
- onboarding and verification services
- wallet and account services
- virtual account services
- beneficiary and counterparty services
- FX and pricing services
- payment and remittance services
- transaction lifecycle services
- compliance and case-management services
- treasury, safeguarding, and settlement services
- ledger and accounting services
- notification and document services
- audit and reporting services

### 9.6 Data and Storage Architecture

The architecture shall support the following core data and storage components:

- MySQL operational database per institutional customer
- MySQL read replica(s) where required
- Redis cache or equivalent
- object storage for documents and generated files
- queue and event-processing layer
- audit and log data stores where required
- reporting and export support components where required

The platform shall ensure that customer operational data, financial data, documents, and audit records remain isolated within the relevant institutional-customer boundary.

### 9.7 Integration and Orchestration Architecture

The architecture shall support controlled connectivity with third-party providers and partners, including:

- banking partners
- payout partners
- payment gateways
- KYC and identity providers
- sanctions and screening providers
- messaging providers
- virtual account providers
- open banking providers
- finance or ERP tools where required

Integration handling shall support:

- API-based integration
- webhook and callback processing
- file-based integration where required
- retry and timeout handling
- idempotency controls
- route prioritisation and failover
- operational logging and traceability

### 9.8 Channel Architecture

The customer-facing and partner-facing channels shall operate against shared core services to ensure consistent outcomes.

This includes:

- Web App
- Mobile App
- Payment Rail
- Backoffice-assisted actions where relevant

Channel-specific differences may exist in presentation, device capabilities, authentication experience, and notification methods, but the underlying business rules and control outcomes shall remain consistent unless an approved product exception exists.

### 9.9 Reporting, Audit, and Observability Architecture

The architecture shall support:

- operational monitoring
- business activity monitoring
- audit logging
- reconciliation visibility
- scheduled reporting
- report exports
- support diagnostics
- incident investigation
- compliance evidence extraction

Where practical, reporting and heavy read workloads should be separated from primary transaction-processing workloads.

### 9.10 Security and Resilience Architecture

The architecture shall support:

- encryption in transit
- encryption at rest
- secure authentication and MFA
- secrets management
- role-based access control
- privileged-access controls
- dedicated customer isolation boundaries
- backup and restore capability
- disaster recovery and business continuity controls
- monitoring and alerting for critical failures and security events

### 9.11 High-Level Infrastructure View

At a high level, the preferred solution design shall include:

- dedicated customer application environments
- dedicated customer operational databases
- shared control-plane and deployment services
- shared observability and monitoring tooling
- customer-facing web and mobile delivery channels
- public API gateway or equivalent API access layer
- backend business services
- queue or event-processing services
- object storage for documents
- third-party integration layer
- reporting and audit-support components

## 10. Non-Functional Requirements

The non-functional requirements in this section shall apply across the Pangea Pay suite unless a requirement is explicitly stated as application-specific, environment-specific, tenant-specific, or deployment-model-specific.

These requirements shall apply, as relevant, to:

- Pangea Backoffice
- Pangea Web App
- Pangea Mobile App
- Pangea Payment Rail
- shared platform services
- databases and storage
- integrations
- reporting services
- operational and monitoring components

The platform shall be designed to support regulated financial-service operations, commercial deployment to institutional customers, multi-channel customer journeys, and controlled growth across tenants, products, corridors, currencies, and transaction volumes.

### 10.1. General Platform Requirements

#### 10.1.1 Standardisation and Data Quality
The platform shall aim to keep data as standardised as possible throughout the suite.

Where practical, the platform shall:

- require users to select values from controlled reference lists
- minimise unnecessary manual free-text entry
- use standardised codes and identifiers where applicable
- support ISO-standard codes where applicable, including country and currency codes
- enforce consistent formatting and validation rules across channels
- support common shared definitions across Backoffice, Web App, Mobile App, and API

Where aggregator clients, API consumers, or institutional customers submit data to the platform, the platform shall support standardised input structures and validation rules.

#### 10.1.2 Multi-Language Support
The platform shall support multi-language capability for customer-facing channels and, where required, internal operational views.

Unless explicitly configured otherwise:

- customer-facing display content may be localised
- all core internal operational data entry may remain in English
- reference data, codes, and core system identifiers shall remain standardised across languages

#### 10.1.3 Multi-Tenant and Multi-Model Support
The platform shall support operation under one or more commercial and deployment models, including:

- multi-tenant SaaS
- single-tenant hosted deployment
- licensed deployment
- transition support for outright commercial transfer where agreed

The platform shall support tenant-aware configuration, access control, branding, reporting scope, and operational segregation.

#### 10.1.4 Version Control and Change Governance
Version control shall be maintained for:

- application code
- configuration changes where applicable
- API versions
- report definitions where applicable
- feature flags and operational controls where applicable
- documentation and release notes

The platform should support governed release and rollback processes.

#### 10.1.5 Analytics and Operational Telemetry
The platform should support analytics and telemetry across:

- Backoffice
- Web App
- Mobile App
- Payment Rail
- operational workflows
- user journeys
- error conditions
- performance metrics

Analytics collection shall remain consistent with privacy, data-minimisation, and security requirements.

### 10.2. Security Requirements

#### 10.2.1 Core Security Controls
The platform must:

- encrypt data in transit
- encrypt data at rest where appropriate to the data type and storage layer
- support role-based access control
- support least-privilege access design
- support MFA for internal users and selected customer journeys
- support secure credential handling
- protect against common application threats
- maintain privileged action logging
- support secure session handling
- support auditability of material security actions

#### 10.2.2 Channel Security Consistency
The platform shall apply consistent core security rules across Web App, Mobile App, Backoffice, and API channels, while allowing channel-specific security controls such as:

- biometric login on mobile
- push-based security notification on mobile
- API credential and token controls
- browser-session controls on web
- privileged-user enforcement on Backoffice

#### 10.2.3 Secure Secret and Credential Management
The platform shall support secure management of:

- API credentials
- encryption keys
- integration secrets
- webhook secrets
- service-account credentials
- signing keys where applicable

Sensitive secrets shall not be exposed in plain text to users who do not require access.

#### 10.2.4 Security Monitoring
The platform should support monitoring and alerting for material security events, including:

- failed login patterns
- suspicious access behaviour
- privileged access changes
- unusual API activity
- credential misuse
- webhook abuse patterns where applicable
- high-risk operational actions

### 10.3. Privacy and Confidentiality Requirements

#### 10.3.1 Confidential Data Handling
The platform must support controlled handling of confidential and sensitive data, including:

- personal data
- business and UBO data
- financial data
- compliance and case data
- document content
- API credentials and integration metadata
- commercial customer data

#### 10.3.2 Data Minimisation and Controlled Exposure
The platform should minimise unnecessary exposure of sensitive data through:

- masked display
- role-based visibility
- field-level restriction where appropriate
- export restrictions
- restricted download capability
- audit logging of sensitive-access events where relevant

#### 10.3.3 Tenant and Environment Segregation
The platform must prevent unauthorised access across:

- tenant boundaries
- environment boundaries
- customer boundaries
- API consumer boundaries
- white-label or institutional customer scopes

### 10.4. Performance Requirements

#### 10.4.1 User and API Performance
The platform should provide acceptable performance for customer-facing, operational, and API-driven use cases.

This includes, as applicable:

- customer registration and onboarding steps
- account and balance views
- quote generation
- FX conversion requests
- payment initiation
- transaction search
- document upload and retrieval
- report generation within expected operational thresholds
- API request processing within agreed service expectations

#### 10.4.2 Responsive User Experience
The Web App and Mobile App should provide responsive user experience under expected business load.

The Backoffice should support efficient search, review, and operational queue handling for data-heavy workflows.

Where possible, the Apps shall display the skeletons while specific page is loading.

#### 10.4.3 Background Processing Performance
The platform should support timely execution of background and asynchronous processes including:

- screening
- notification delivery
- webhook delivery
- queue-based transaction processing
- statement generation
- report scheduling
- reconciliation-related processing
- audit and logging pipelines

### 10.5. Availability and Reliability Requirements

#### 10.5.1 Service Availability
The platform should support high availability for critical customer-facing and operational services.

Availability design shall consider:

- customer access
- transaction processing
- balance visibility
- API access
- operational monitoring
- treasury and safeguarding visibility
- compliance operations
- document access required for operational continuity

#### 10.5.2 Graceful Degradation
Where full service is not available, the platform should support controlled degraded-mode operation where safe and operationally appropriate.

This may include:

- read-only access for selected modules
- temporary disablement of selected functions
- delayed transaction processing
- queueing for later execution
- restricted route availability
- controlled customer messaging during outage

#### 10.5.3 Reliability of Financial Processing
The platform must support reliable financial and operational processing, including:

- protection against duplicate processing
- idempotent handling where required
- traceable retries
- safe queue replay
- controlled partner retry logic
- prevention of silent data loss in material workflows

### 10.6. Scalability Requirements

#### 10.6.1 Volume Scalability
The platform should support growth in:

- customer count
- business-customer user count
- wallet and account count
- virtual account count
- transaction volume
- transaction value
- API request volume
- document volume
- tenant count
- corridor and currency count
- report and audit load

#### 10.6.2 Functional Scalability
The platform should support expansion of:

- products
- payout methods
- funding methods
- integrations
- customer segments
- geographies
- white-label customers
- institutional API consumers

#### 10.6.3 Architectural Scalability
The architecture should support scaling of customer-facing services, API services, integrations, reporting, and background processing independently where practical.

### 10.7. Maintainability and Supportability Requirements

#### 10.7.1 Modular Design
The platform should use modular design principles so that major functional domains can be maintained, enhanced, tested, and deployed with controlled dependency management.

#### 10.7.2 Configuration-Driven Operation
Where practical, the platform should support configuration-driven operation instead of requiring source-code changes for routine business changes.

This includes, as applicable:

- product configuration
- corridor configuration
- pricing configuration
- notification templates
- integration configuration
- feature flags
- operational controls
- report definitions where applicable

#### 10.7.3 Supportability
The platform should support efficient operational and technical support through:

- structured logs
- traceable identifiers
- health monitoring
- queue visibility
- exception visibility
- integration monitoring
- audit history
- support-friendly error and correlation references

#### 10.7.4 Controlled Deployment and Release
The platform should support structured testing, deployment, rollback, and release governance for:

- applications
- APIs
- integrations
- configuration changes
- feature toggles
- documentation changes

### 10.8. Auditability and Traceability Requirements

#### 10.8.1 Full Traceability of Material Actions
The platform must provide full traceability of key business, financial, compliance, security, and administrative actions.

Traceability shall apply to, as applicable:

- customer and onboarding changes
- account and beneficiary changes
- quote acceptance
- transaction initiation and servicing
- approval workflows
- compliance actions
- manual accounting actions
- document handling
- integration changes
- API write actions
- report export
- feature and operational control changes

#### 10.8.2 Cross-Object Traceability
The platform should support linkage across related records such as:

- customer
- account
- beneficiary
- quote
- transaction
- case
- ledger entry
- settlement reference
- reconciliation item
- report output
- API request
- webhook event

#### 10.8.3 Evidence Extraction
The platform must support evidence extraction for:

- customer servicing
- operational investigation
- reconciliation
- compliance review
- internal audit
- external audit
- dispute handling
- regulatory inspection

### 10.9. Integration and Interoperability Requirements

#### 10.9.1 Integration Readiness
The platform shall support integration with external systems and providers including, as applicable:

- banking partners
- payout partners
- payment gateways
- KYC and identity providers
- screening providers
- messaging providers
- virtual account providers
- open banking providers
- finance or ERP tools where required
- monitoring and support tools

#### 10.9.2 Standardised Integration Controls
The platform should support standardised integration patterns, including:

- REST APIs
- webhooks
- file-based exchange where necessary
- structured status mapping
- standardised error handling
- retry handling
- timeout handling
- idempotency controls
- audit logging of partner interaction

#### 10.9.3 API and Documentation Quality
The Payment Rail and internal integration surfaces should support consistent schemas, standardised status models, and documented behaviour suitable for partner onboarding and maintenance.

### 10.10. Usability and Accessibility Requirements

#### 10.10.1 Clear and Consistent Experience
The platform should provide a clear, consistent, and user-appropriate experience across applications.

This includes:

- simple customer journeys
- understandable labels and actions
- consistent terminology
- predictable navigation
- status clarity
- clear error messaging
- support for seamless movement between supported workflows

#### 10.10.2 Cross-Channel Experience Consistency
The Web App and Mobile App shall provide the same core functionalities, workflow steps, validation outcomes, pricing outcomes, status model, and customer outcomes, subject only to channel-specific experience and device differences.

#### 10.10.3 Accessibility
Customer-facing and internal interfaces should support accessibility standards appropriate to the chosen frontend technologies and target environments.

Accessibility considerations should include, as applicable:

- keyboard navigation
- readable contrast
- semantic structure
- assistive-technology compatibility
- clear focus states
- accessible form validation and messaging

### 10.11. Mobile-Specific Non-Functional Requirements

#### 10.11.1 Mobile Device Support
The Mobile App should support a defined range of current and supported iOS and Android versions in line with product policy.

#### 10.11.2 Mobile Security Controls
The Mobile App should support mobile-specific security controls including:

- secure token storage
- biometric authentication where enabled
- app-version enforcement where required
- secure session invalidation
- protection against insecure device state where supported by policy

#### 10.11.3 Mobile Notification Support
The Mobile App should support push-notification delivery where configured and where device, operating-system, and customer permissions allow.

### 10.12. API-Specific Non-Functional Requirements

#### 10.12.1 API Reliability
The Payment Rail should support reliable request handling, predictable status responses, and safe repeat-request handling for relevant write operations.

#### 10.12.2 API Rate Limiting and Protection
The API should support rate limiting, abuse protection, and consumer-specific traffic controls to protect service stability.

#### 10.12.3 API Observability
The API should support operational observability through:

- request metrics
- success and failure metrics
- latency metrics
- authentication failure metrics
- webhook delivery metrics
- consumer-level visibility

### 10.13. Reporting and Data Access Requirements

#### 10.13.1 Reporting Performance and Segregation
The platform should support operational reporting without unduly affecting core transactional processing.

Where practical, reporting workloads should be separated from primary transaction-processing workloads.

#### 10.13.2 Export Controls
The platform should support controlled export of data and reports with appropriate permission controls, masking rules, and audit logging where relevant.

#### 10.13.3 Historical Access
The platform should support access to historical operational, financial, compliance, and audit records in accordance with retention rules, permissions, and archival strategy.

### 10.14. Observability and Operational Monitoring Requirements

#### 10.14.1 Monitoring Coverage
The platform should support monitoring across:

- application health
- infrastructure health
- database health
- queue processing
- integration performance
- security events
- failed jobs
- API traffic
- webhook delivery
- document processing
- reporting jobs
- backup and recovery events

#### 10.14.2 Alerting
The platform should support alerting for critical operational and technical conditions, including:

- service outage
- severe latency degradation
- failed background processing
- failed integration route
- queue backlog
- backup failure
- unusual security event
- treasury or safeguarding visibility failure where relevant

#### 10.14.3 Operational Dashboards
The platform should support operational dashboards appropriate to support, engineering, operations, treasury, compliance, and management use cases.

### 10.15. Testing and Quality Assurance Requirements

#### 10.15.1 Test Coverage
The platform should support structured testing across:

- unit testing
- integration testing
- end-to-end testing
- regression testing
- API testing
- security testing
- performance testing
- recovery testing
- user-acceptance testing
- configuration testing where relevant

#### 10.15.2 Pre-Release Validation
Material production changes should undergo appropriate validation prior to release, including:

- functional validation
- security validation
- integration validation
- migration validation where applicable
- rollback readiness check
- documentation update where needed

#### 10.15.3 Environment Support
The platform should support appropriate non-production environments for:

- development
- testing
- staging or pre-production
- sandbox for API consumers where offered

### 10.16. Compliance and Regulatory Support Requirements

#### 10.16.1 Regulated-Operations Support
The platform must support the operational needs of regulated financial-service businesses, including support for:

- AML / CTF controls
- customer onboarding controls
- auditability
- recordkeeping
- safeguarding support
- settlement and reconciliation support
- evidence extraction
- controlled reporting

#### 10.16.2 Policy and Control Alignment
The platform should support alignment between technical controls and operational policy, including:

- access control policy
- retention policy
- onboarding rules
- pricing governance
- approval rules
- incident and continuity controls
- data-governance obligations

#### 10.16.3 Contractual and Customer-Specific Support
Where Pangea Pay is delivered to institutional customers, the platform should support customer-specific non-functional expectations where commercially agreed, including:

- branding
- tenant isolation
- deployment model
- support arrangements
- environment model
- reporting scope
- API entitlement
- operational thresholds

### 10.17. Indicative Service Targets

The following targets are indicative baseline service targets for planning, architecture, and operational design purposes. Final service commitments may be refined in contractual schedules, service policies, deployment-specific operating documents, or environment-specific standards.

#### 10.17.1 Performance Targets
The platform should be designed to support indicative targets such as:

- API response time at P95 of less than 500 milliseconds for standard synchronous inquiry requests under normal operating conditions
- customer-facing page or screen response times appropriate to a modern financial-services application under normal operating conditions
- quote-generation response times suitable for real-time customer journeys
- notification dispatch initiation within 2 minutes for standard asynchronous operational notifications under normal conditions

#### 10.17.2 Availability Targets
The platform should be designed to support service availability targets such as:

- platform availability of 99.9% or higher for critical production services, excluding approved maintenance windows
- controlled degraded-mode operation for selected services where full availability is not possible

#### 10.17.3 Recovery Targets
The platform should be designed to support indicative recovery targets such as:

- Recovery Time Objective for critical services of less than 4 hours
- Recovery Point Objective for critical transactional data of less than 15 minutes

#### 10.17.4 Review and Adjustment
These targets shall be reviewed and refined based on:

- deployment model
- customer-specific requirements
- regulatory expectations
- infrastructure design
- contractual commitments
- incident and capacity experience