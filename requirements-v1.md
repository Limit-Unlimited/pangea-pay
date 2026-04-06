# Business Requirements for Pangea Pay
_**Version 1.0**_

## Introduction
Pangea Pay is a proprietary software suite, designed and developed by Limit Unlimited Technologies Ltd (Limit Unlimited).

The suite will form a complete remittance and payments platform. This **_REQUIREMENTS.md_** file sets out the business requirements for the Pangea Pay application suite, including functional scope, non-functional requirements, solution architecture, and recommended technology stack.

The platform is intended to support secure digital remittance journeys for end users, robust internal operational control, compliance oversight, treasury and settlement management, and integration with third-party providers.

The preferred operational database is **MySQL**.


## Use Case
Pangea Pay will be used by the following types of businesses to run and manage their remittance and cross-border payment activities:

* Payment institutions
* Remittance service providers
* Electronic Money Institutions
* Money service businesses and
* Any other regulated financial institutions who offers remittance and/or cross-border payment services.

Any businesses from the above list can use Pangea Pay by purchasing limited software licence from Limit Unlimited. 

## Project Scope
The suite will include the following software applications.

| Application | Description |
|-------------|-------------|
| 1. Pangea Backoffice | A secure web application which will serve as the core platform for the entire suite. The Backoffice application will include, but not be limited to, the following capabilities: <br><br>• Global settings for the whole suite <br>• Backoffice user management and role-based access control <br>• Customer management <br>• Beneficiary management <br>• Treasury management <br>• AML/CTF and compliance case management <br>• Transaction management <br>• Settlement and reconciliation management <br>• Integrations with third parties, including banking partners, payment gateways, payout partners, and compliance services <br>• Reporting and audit trail access |
| 2. Pangea Web App | A secure web application for end users to register and conduct transactions. Core functionalities will include: <br><br>• Customer registration <br>• KYC onboarding <br>• Beneficiary management <br>• Quote generation <br>• Creating transactions <br>• Transaction tracking <br>• Profile management <br>• Transaction history <br>• App security management |
| 3. Pangea Mobile App | There will be two mobile apps, one for iOS devices and one for Android devices. The mobile apps will provide the same core customer journeys and functionalities as the Pangea Web App, including registration, onboarding, beneficiary management, transaction creation, tracking, profile management, and security controls. |
|4. Pangea Payment Rail| A public API for aggregator clients to use the Pangea Pay's global payment network. The project scope also includes the delivery of a modern, `html` documentation of the API will all the APIs and their sample requests and responses.|

## Business Objective
The objective of Pangea Pay is to deliver a secure, scalable, compliant, and operationally efficient remittance platform that:

- enables end users to send money internationally through web and mobile channels
- supports multiple payout corridors and payout methods
- provides a centralised backoffice platform for operational, compliance, treasury, and reporting functions
- ensures compliance with AML, CTF, sanctions, PEP, and transaction monitoring requirements
- maintains robust financial controls through ledgering, settlement, and reconciliation
- supports future expansion through configurable integrations and modular architecture

## In Scope
The Pangea Pay suite shall include:

- end-user registration and authentication
- aggregator client onboarding
- customer profile management
- KYC onboarding and verification workflows
- beneficiary management
- quote generation and FX pricing
- remittance transaction creation and lifecycle management
- transaction tracking and history
- AML/CTF screening, case management and monitoring
- treasury management
- payment orchestration
- partner integrations
- settlement and reconciliation
- notification and communication services
- transaction query management (with and between the end-user , the aggregator client and the payout partner)
- reporting and audit trail management
- backoffice user management
- global configuration management

## Out of Scope
The following are outside the scope of this phase unless explicitly added later:

- physical agent management
- branch teller operations
- stored-value wallet product
- card issuing
- lending or credit products
- cryptocurrency-based transfers
- loyalty and rewards schemes

## Stakeholders

| Stakeholder Group | Interest / Responsibility |
|---|---|
| Executive Leadership | Strategic direction, funding, oversight |
| Product Team | Requirements, roadmap, prioritisation |
| Operations Team | Transaction operations, exception handling, servicing |
| Compliance / AML Team | Screening, monitoring, investigations, controls |
| Treasury / Finance Team | Settlement, liquidity, reconciliation, financial reporting |
| Technology Team | Design, development, security, support |
| Customer Support Team | Customer communication and support handling |
| Banking / Payment Partners | Funding, settlement, payout, payment processing |
| End Users | Registration, transfers, tracking, profile management |
| Aggregator Clients | Authentication, transfers, tracking |

## Functional Requirements

## 1. Pangea Backoffice

The Backoffice application shall be the central operational platform of the Pangea Pay suite.

### 1.1 Global Settings
The Backoffice shall allow authorised users to manage global settings including:

| Functionality | Description |
| ------------- | ----------- |
| Core Setup | The core setup will be configured by a system admin only. The user can only view the current core setup. The core setup screen will display the following information: • Company Details <br> • Base Currency <br> • Pangea Pay Backoffice version <br> • Pangea Pay Web App version <br> • Pangea Pay iOS App version <br> • Pangea Pay Android App version <br> • API health (Pangea Pay Web App, Pangea Pay Mobile Apps, Public API) <br> • Missing Configurations
| Country configuration | Under the Country configuration functionality, the user shall be able to add, remove, modify corridor, including activating and deactivating a corridor. The following information must be stored under the Country configuration: <br><br> • Flag <br> • Country <br> • Send Country (Yes/No) <br> • Receive Country (Yes/No) <br> •  Available Services <br> • CRA Level |
| Payout method configuration | Using this configuration, the user shall be able to add, remove, modify, activate, and deactivate Payout methods at a global level. The data for the `Available Services` in the Country Configuration will be based on active payout methods configured. If any active payout method is deactivated from this global settings, then the deactivated payout method will be disabled from all the countries in the country configuration |
| Fee configuration | Fee must be configured for all `Available Services`, for each `Send` and `Receive` country pairs, e.g., From UK to Bangladesh, Transfer to Bank A/C, Transfer to Wallet, Cash Collection services. The database must record all change logs for recordkeeping |
| Notification template settings | The user shall be able to add, remove, modify, activate, deactivate notification templates based on various events on Pangea Pay Backoffice, web app, mobile apps and Public API |
| Application security settings | This section shall have the configuration for the following: <br><br>• Password Policy <br>• MFA Policy <br>• Session Management <br>• Login and Access Control <br>• Role and Permission Management <br>• Audit and Security Logging Settings <br>• Notification Settings for Security Events <br>• Security Settings Change Control |
| Integration configuration parameters | The Backoffice shall provide a controlled configuration area for managing technical and business parameters used in third-party integrations across the Pangea Pay suite. The following functionalities shall be present in the suite: <br> <br> **Integration Registry** <br>  - The system shall maintain a central list of all configured integrations. <br>- Each integration record shall include: <br>     - integration name <br>     - integration type <br>     - provider name <br>     - purpose <br>      - environment designation <br>     - current status <br>     - owner/support contact metadata |
| Feature flags and operational controls | The Backoffice shall provide a controlled framework for enabling, disabling, or adjusting platform features and operational behaviours without requiring source code deployment for every change. <br><br> **Functional Requirements**<br> <ins>1. Feature Flag Management</ins><br> The system shall allow authorised users to create, update, activate, deactivate, and retire feature flags. Each feature flag shall include: <br><br> - flag name <br>     - description <br>     - owning team or function <br>     - target application <br>     - effective environment <br>     - activation status  <br>     - start and end date where applicable<br><br><ins> 2. Application-Specific Feature Control</ins><br> The system shall support feature flags at application level for: <br><br>     - Backoffice <br>     - Web App <br>     - Mobile App <br>     - API channels <br><br>   The system shall allow a feature to be enabled in one application while remaining disabled in another. <br><br><ins> 3. Environment-Specific Feature Control</ins><br> The system shall support feature flag behaviour by environment. A feature may be enabled in test or staging environments without being enabled in production. <br><br><ins> 4. User Segment and Role-Based Feature Enablement</ins><br> The system shall support restricted rollout of features by: <br><br>      - user type <br>     - user role <br>     - region or corridor <br>     - customer segment <br>      - internal team <br><br> The system shall support pilot or phased rollouts. <br><br><ins> 5. Operational Controls</ins><br> The system shall allow authorised users to enable or disable operational behaviours, including but not limited to: <br><br>     - new customer registration <br>      - new beneficiary creation <br>      - transaction initiation <br>     - selected payout methods <br>      - selected corridors <br>      - selected integration routes <br>      - document upload <br>     - notification channels <br><br><ins> 6. Maintenance and Emergency Controls</ins><br> The system shall support immediate operational controls for emergency situations. The system shall allow authorised users to: <br><br>      - disable a corridor <br>      - suspend a payout method <br>      - disable a provider route <br>      - pause new transactions <br>      - restrict selected user journeys <br>      - place selected modules into maintenance mode <br><br><ins> 7. Scheduling and Time-Based Activation</ins><br>    The system shall allow flags and controls to be activated immediately or at a scheduled date and time The system shall support expiry dates for temporary controls. <br><br><ins> 8. Dependency and Validation Rules</ins><br> The system shall validate conflicting or dependent flags before activation. The system shall prevent activation of invalid combinations where configured business rules would be breached. <br><br><ins> 9. Visibility and Impact Preview </ins><br> The system shall show authorised users the intended scope of each feature flag or operational control, including: <br><br>      - affected application <br>      - affected environment <br>      - affected user groups <br>     - affected corridors or providers <br>     - activation timing <br><br><ins> 10. Audit and Traceability </ins><br> The system shall maintain a full audit trail for all feature flag and operational control changes. The audit trail shall capture: <br><br>      - control name <br>     - old value and new value <br>     - user making the change <br>     - date and time <br>     - reason for change <br>     - approval details where applicable <br><br><ins> 11. Approval Workflow for Critical Operational Controls</ins><br> The system shall support maker-checker or approval workflow for critical controls, including: <br><br>      - disabling transaction initiation <br>     - disabling production corridors <br>      - disabling live payout routes <br>     - enabling high-impact features in production <br><br><ins> 12. Monitoring and Status Dashboard</ins><br> The system shall provide a dashboard view of active feature flags and operational controls. The dashboard shall show: <br><br>      - currently active controls      - scheduled changes <br>      - expired controls <br>      - emergency controls in effect <br>     - impacted applications and services |

### 1.2 User Management
The Backoffice shall support:

- internal user creation, update, suspension, and deactivation
- role-based access control
- password and authentication policy enforcement
- MFA for privileged users
- audit logging of user and permission changes

#### 1.2.1 User Creation
For user creation, the following information will be required:

- First and last names
- Email
- Mobile number
- MFA (Mark if the user is required to use MFA to log in)

#### 1.2.2 Role Assignment
Once a user is created, the user must be assigned at least one Role. A user can have multiple role permissions.

#### 1.2.3 Role Management
Before a role can be assigned, the role must be configured in the Pangea backoffice. A user with the appropriate permission can add, disable or modify any roles. For adding or modifying a role, the user will be given all functionalities of the Pangea Pay backoffice, where the user shall select the permission type, e.g., read/write, or no permission.

### 1.3 Customer Management
The Backoffice shall allow authorised users to:

- search and view customer profiles
- review onboarding and KYC status
- review beneficiary records
- review transaction history
- update customer status subject to permission controls
- maintain notes and operational comments
- view audit history

### 1.4 Treasury Management
The Backoffice shall support treasury operations including:

- liquidity monitoring
- funding account visibility
- partner prefunding balance tracking
- treasury alerts and thresholds
- operational oversight of settlement positions
- management reporting for treasury activity

### 1.5 AML / CTF Management
The Backoffice shall support AML/CTF functions including:

- sanctions screening review
- PEP and adverse media review
- alert generation and review
- transaction monitoring workflows
- case creation, assignment, escalation, and closure
- hold, release, reject, and refer decisions
- full audit trail of compliance actions

### 1.6 Transaction Management
The Backoffice shall support:

- transaction search and retrieval
- transaction status visibility
- transaction hold, cancel, fail, refund, and release workflows subject to permission controls
- payout submission status visibility
- review of transaction events and lifecycle history
- exception handling and investigation support

### 1.7 Integrations Management
The Backoffice shall support visibility and administration for integrations with third parties including:

- banking partners
- payment gateways
- payout partners
- KYC and compliance services
- messaging providers

It shall support logging, status monitoring, and configuration management where appropriate.

### 1.8 Reports
The Backoffice shall provide access to reports including:

- transaction reports
- customer reports
- compliance and case reports
- treasury and settlement reports
- reconciliation reports
- operational dashboards
- exportable MI and audit reports

## 2. Pangea Web App

The Pangea Web App shall provide a secure customer-facing digital channel.

### 2.1 Customer Registration
The web app shall allow customers to:

- create an account
- verify their email and/or mobile number
- set authentication credentials
- accept terms and conditions
- complete basic registration steps securely

### 2.2 KYC Onboarding
The web app shall support:

- capture of customer details
- document upload
- proof of address collection
- onboarding review workflow
- communication of onboarding status to the customer

### 2.3 Beneficiary Management
The web app shall allow customers to:

- create beneficiaries
- update beneficiaries
- remove or deactivate beneficiaries where permitted
- select payout methods and beneficiary details by corridor

### 2.4 Quote and Pricing
The web app shall allow customers to:

- request transfer quotes
- view exchange rate, fees, send amount, and receive amount
- confirm quotes within a validity period

### 2.5 Creating Transactions
The web app shall allow customers to:

- create a remittance transaction
- select an existing beneficiary
- review transfer details
- confirm transfer initiation
- receive confirmation and tracking reference

### 2.6 Transaction Tracking
The web app shall allow customers to:

- view current transaction status
- view milestone updates
- identify whether a transaction is under review, in progress, paid, failed, or refunded

### 2.7 Profile Management
The web app shall allow customers to:

- update permitted profile details
- manage password and security settings
- review verification status
- manage communication preferences

### 2.8 Transaction History
The web app shall provide access to:

- transaction history
- transaction detail view
- receipt or confirmation view
- status and historical event summary

### 2.9 App Security Management
The web app shall support:

- secure login/logout
- MFA where configured
- password reset
- suspicious login protection
- session management and timeout controls

## 3. Pangea Mobile App

The Pangea Mobile App shall be available for both iOS and Android. Both apps shall provide the same core functionality and customer journeys as the web application, including:

- customer registration
- KYC onboarding
- beneficiary management
- quote generation
- transaction creation
- transaction tracking
- profile management
- transaction history
- security management

The mobile apps shall also support:

- responsive mobile-native user experience
- push notifications where configured
- secure device session handling
- biometric authentication where supported and approved

## Core Platform Requirements

## 4. Customer and Identity Management
The platform shall:

- maintain customer profiles
- support secure identity and authentication controls
- maintain customer status and risk metadata
- record material changes for audit purposes

## 5. Pricing and FX
The platform shall:

- calculate corridor-based exchange rates and fees
- support configurable pricing rules
- support promotions and special pricing logic
- record quoted and accepted rates for audit and dispute purposes

## 6. Transaction Processing
The platform shall:

- create remittance transactions
- maintain lifecycle states
- support transaction validation and control checks
- expose transaction status to customers and backoffice users
- maintain transaction event history

Indicative statuses include:

- DRAFT
- PENDING_KYC
- PENDING_SCREENING
- AWAITING_FUNDS
- FUNDED
- SUBMITTED_TO_PAYOUT
- PAID
- FAILED
- CANCELLED
- REFUNDED
- ON_HOLD

## 7. Limits and Rules
The platform shall:

- apply transaction and customer limits
- enforce corridor and payout restrictions
- apply velocity and risk rules
- support controlled overrides with audit logs where authorised

## 8. Payment Orchestration
The platform shall:

- route payout requests to the correct partner
- support multiple payout methods
- process callbacks and partner responses
- support retries, timeout handling, and idempotency
- maintain partner interaction logs

## 9. Ledger, Settlement, and Reconciliation
The platform shall:

- maintain an internal financial ledger
- record immutable journal entries for financial events
- track settlement obligations and prefunding positions
- reconcile transactions against partner and bank confirmations
- identify and manage exceptions and unmatched items

## 10. Notification and Communication
The platform shall:

- send OTP, email, SMS, and push notifications as configured
- notify customers about onboarding, transaction, and security events
- support message templates and channel controls

## 11. Document Management
The platform shall:

- store customer and compliance documents securely
- support controlled retrieval by authorised users
- tag and classify documents
- link documents to onboarding, compliance, and transaction records

## 12. Reporting and Audit
The platform shall:

- provide operational dashboards and reports
- provide audit trails of material actions
- support exportable reports for management, finance, and compliance purposes

## Non-Functional Requirements

### General
- We aim to keep our data as standardised as possible throughout the suite. Where possible, we will require the users to select data from lists and reduce the scope for manual data entry by the users, e.g., country, city, etc. shall be selected from drop down lists. Where possible, we shall use ISO codes, e.g., country, currency, etc.
- For Aggregator clients, we will also require them to send us standardised codes.
- The suite will be available in multiple languages, however, all input shall be in **English**.
- To reduce data mismatch or chances for duplication, all data entry shall in CAPITAL letters only
- Version control must be maintained at all times for all the applications
- Analytics to be included on Pangea Backoffice, Web and Mobile Apps
- Email and SMS services shall be integrated to communicate transactional and marketing information with the end-users and aggregator clients

### Security
The platform must:

- encrypt data in transit and at rest
- support RBAC and least-privilege access
- support MFA for internal users and selected customer journeys
- protect against common application threats
- maintain privileged action logs

### Performance
The platform should:

- return quote responses within acceptable business thresholds
- support concurrent customer transaction activity
- support operational search and reporting with acceptable response times

### Availability
The platform should:

- support high availability for customer-facing applications
- minimise downtime for critical business functions
- support graceful handling of third-party outages where possible

### Scalability
The platform should:

- support growing user, transaction, and corridor volumes
- allow scaling of customer-facing and integration components
- separate reporting load from core transaction processing

### Auditability
The platform must:

- provide full traceability of key business and compliance actions
- support investigation and evidence extraction

### Maintainability
The platform should:

- use modular design principles
- support structured testing and deployment
- provide monitoring and observability for support teams

## Solution Architecture Summary

The preferred solution design is a modular application suite consisting of:

- Pangea Backoffice
- Pangea Web App
- Pangea Mobile App for iOS
- Pangea Mobile App for Android
- API and integration layer
- Core backend services/modules
- MySQL primary database
- MySQL read replica(s)
- Redis cache
- queue/event processing layer
- object storage for documents
- third-party service integrations

## Complete Tech Stack

### Frontend
- **React.js** for web applications
- **Next.js** for the customer web app where SSR or hybrid rendering is beneficial
- **TypeScript**
- **Material UI** or **Tailwind CSS**
- **React Query / TanStack Query**
- **React Hook Form** or **Formik**
- **Zod** or **Yup**

### Mobile
- **React Native** with **TypeScript** for iOS and Android apps

### Backend
- **Node.js**
- **Express.js**

Recommended structural option:
- **NestJS** if a more opinionated modular backend framework is preferred

Supporting libraries:
- **TypeScript**
- **Prisma ORM** or **TypeORM**
- **Joi** or **Zod**
- **JWT**
- **Passport.js**
- **bcrypt**
- **Winston** or **Pino**

### Database and Storage
- **MySQL 8.x** with **InnoDB**
- **MySQL read replicas**
- **Redis**
- **AWS S3** or equivalent object storage

### Messaging and Async Processing
- **RabbitMQ** or **BullMQ**
- **Kafka** may be considered for larger event-driven requirements

### API and Documentation
- **REST API**
- **Swagger / OpenAPI**

### Security
- **OAuth 2.0 / OpenID Connect** where applicable
- **Helmet.js**
- rate limiting middleware
- secret management solution such as **AWS Secrets Manager** or **HashiCorp Vault**

### DevOps / Infrastructure
- **Docker**
- **Kubernetes**
- **Nginx**
- **Terraform**
- **GitHub Actions** or **GitLab CI/CD**

### Monitoring and Observability
- **Prometheus**
- **Grafana**
- **ELK Stack** or **OpenSearch**
- **Sentry**
- **OpenTelemetry**

### Testing
- **Jest**
- **React Testing Library**
- **Cypress** or **Playwright**
- **Supertest**
- **Postman / Newman**

## Recommended Data Design Principles

The platform should adopt the following principles:

- MySQL shall be the operational source of truth
- financial postings shall be immutable
- ledger design shall follow journal-based accounting principles
- transaction state history shall be append-only
- reporting workloads should be separated from the primary transaction database
- integrations shall be processed with idempotency and auditability in mind

## Risks and Mitigations

| Risk | Description | Mitigation |
|---|---|---|
| Compliance Risk | Failure to meet AML/CTF or sanctions obligations | Strong screening workflows, case management, audit controls |
| Integration Risk | Third-party service instability or inconsistency | Abstraction layer, retries, monitoring, fallback handling |
| Operational Risk | Manual workload increases with scale | Workflow tooling, dashboards, automation |
| Financial Risk | Weak ledger or reconciliation controls | Journal-based ledger, reconciliation controls, exception queues |
| Security Risk | Exposure of customer or transaction data | Encryption, RBAC, secrets management, monitoring |

## Success Criteria

The Pangea Pay suite will be considered successful if it:

- supports secure end-to-end remittance journeys across web and mobile
- provides a robust and usable backoffice platform
- supports AML/CTF and compliance case handling effectively
- provides reliable transaction processing and status tracking
- supports treasury, settlement, and reconciliation control
- provides a scalable technical foundation for future growth and integrations

## Future Considerations

Potential future enhancements may include:

- additional payout corridors and methods
- business or corporate customer journeys
- white-label or partner distribution models
- advanced fraud analytics
- AI-assisted case triage
- enhanced treasury automation
- open banking funding flows
- wallet functionality

---