# Pangea Pay — Go-Live Checklist

**Purpose:** Signed-off checklist for production launch. Each item must be confirmed by a named owner before go-live approval is granted. No items may be bypassed without explicit sign-off from the product lead and relevant compliance/technical owner.

---

## 1. Infrastructure & Deployment

| # | Item | Owner | Status |
|---|---|---|---|
| 1.1 | Production environment provisioned (cloud provider, region confirmed) | DevOps | |
| 1.2 | All three apps deployed: Backoffice, Web App, Payment Rail | DevOps | |
| 1.3 | DNS configured for all domains (backoffice, customer-facing, API) | DevOps | |
| 1.4 | TLS/SSL certificates valid and auto-renewing (Let's Encrypt or ACM) | DevOps | |
| 1.5 | HTTP → HTTPS redirect active on all endpoints | DevOps | |
| 1.6 | Environment variables in secrets vault — no plaintext in config files | DevOps | |
| 1.7 | Database connection string points to production DB, not dev/staging | DevOps | |
| 1.8 | All Drizzle migrations applied to production database | Engineering | |
| 1.9 | Performance indexes (migration 0010) confirmed applied | Engineering | |

---

## 2. Security

| # | Item | Owner | Status |
|---|---|---|---|
| 2.1 | Security headers configured on all three apps (CSP, HSTS, X-Frame-Options) | Engineering | Done (code) |
| 2.2 | Rate limiting active on login, register, and API auth endpoints | Engineering | Done (code) |
| 2.3 | OWASP Top 10 self-review completed; no high/critical findings open | Engineering | |
| 2.4 | Penetration test or external security review completed | Security | |
| 2.5 | All findings from security review resolved or risk-accepted | Security + Product | |
| 2.6 | Session invalidation on logout confirmed (NextAuth signOut clears JWT) | Engineering | |
| 2.7 | API consumer secrets stored as bcrypt hashes — never in plaintext | Engineering | Done (code) |
| 2.8 | Bearer tokens stored as SHA-256 hashes — never in plaintext | Engineering | Done (code) |
| 2.9 | Webhook payloads signed with HMAC-SHA256 | Engineering | Done (code) |
| 2.10 | Database user has minimum required permissions (no root/superuser) | DevOps | |
| 2.11 | No sensitive data (PII, credentials) written to application logs | Engineering | |
| 2.12 | Secrets rotation procedure documented and tested (rotate without downtime) | DevOps | |

---

## 3. Third-Party Integrations

| # | Item | Owner | Status |
|---|---|---|---|
| 3.1 | KYC / identity verification provider: production credentials configured | Engineering | |
| 3.2 | Sanctions / PEP screening provider: production credentials configured | Engineering | |
| 3.3 | Banking / payout partner: production connectivity confirmed | Engineering | |
| 3.4 | FX rate feed (Frankfurter or replacement): production URL confirmed, failover tested | Engineering | |
| 3.5 | Email provider (SMTP/SES/SendGrid): production credentials, test send confirmed | Engineering | |
| 3.6 | SMS provider: production credentials, test send confirmed | Engineering | |
| 3.7 | All mock adapters replaced with live adapters in production config | Engineering | |

---

## 4. Monitoring & Alerting

| # | Item | Owner | Status |
|---|---|---|---|
| 4.1 | Uptime monitoring on `/api/health` for all three apps | DevOps | |
| 4.2 | Alert: health endpoint returns 503 for > 1 minute | DevOps | |
| 4.3 | Alert: application error rate > 1% in 5-minute window | DevOps | |
| 4.4 | Alert: payment failure rate > 5% in 15-minute window | DevOps | |
| 4.5 | Alert: database connection pool exhausted | DevOps | |
| 4.6 | Alert: webhook delivery failure rate > 20% (too many abandoned) | DevOps | |
| 4.7 | Log aggregation (Cloudwatch, Datadog, etc.) confirmed flowing | DevOps | |
| 4.8 | On-call runbook distributed to day-one operations team | Product | |

---

## 5. Database & Backup

| # | Item | Owner | Status |
|---|---|---|---|
| 5.1 | Automated daily backups enabled (RDS automated backup or equivalent) | DevOps | |
| 5.2 | Backup retention period confirmed (minimum 7 days) | DevOps | |
| 5.3 | Point-in-time recovery tested: restore to a known timestamp confirmed working | DevOps | |
| 5.4 | RTO and RPO documented: target RTO < 4h, RPO < 1h | DevOps + Product | |
| 5.5 | Restore runbook written, reviewed, and accessible to on-call team | DevOps | |

---

## 6. UAT Sign-off

| # | Flow | Tester | Status |
|---|---|---|---|
| 6.1 | Customer registration → email verification → onboarding submission | QA | |
| 6.2 | Backoffice: onboarding review → approve customer | QA | |
| 6.3 | Web App: add beneficiary → request FX quote → submit payment | QA | |
| 6.4 | Web App: view transaction history; payment status updates visible | QA | |
| 6.5 | Backoffice: payment ops — hold, release, complete, fail a payment | QA | |
| 6.6 | Backoffice: compliance alert raised → reviewed → cleared | QA | |
| 6.7 | Backoffice: reconciliation upload — CSV processed, items matched | QA | |
| 6.8 | Payment Rail: authenticate → request quote → submit payment → poll status → webhook received | QA | |
| 6.9 | All UAT flows signed off by product lead | Product Lead | |

---

## 7. Legal & Compliance

| # | Item | Owner | Status |
|---|---|---|---|
| 7.1 | Legal review of Terms of Service and Privacy Policy completed | Legal | |
| 7.2 | AML / KYC compliance review completed | Compliance | |
| 7.3 | Data processing agreements in place with all third-party providers | Legal | |
| 7.4 | GDPR / data residency requirements confirmed met | Legal + DevOps | |
| 7.5 | PSD2 / EMD2 or applicable regulatory licensing confirmed | Legal | |

---

## 8. Rollback Plan

| # | Item | Owner | Status |
|---|---|---|---|
| 8.1 | Previous release tagged in git | Engineering | |
| 8.2 | Rollback procedure documented: redeploy previous container/build | DevOps | |
| 8.3 | Database rollback procedure documented: migration reversal steps identified | Engineering | |
| 8.4 | Rollback drill completed: previous version deployed successfully in staging | DevOps | |
| 8.5 | Rollback decision criteria agreed: who can authorise and under what conditions | Product + DevOps | |
| 8.6 | Estimated rollback time confirmed < 30 minutes | DevOps | |

---

## 9. First Tenant & Commercial Readiness

| # | Item | Owner | Status |
|---|---|---|---|
| 9.1 | First tenant provisioned in production via seed/admin tool | Engineering | |
| 9.2 | First backoffice admin user created and login confirmed | Engineering | |
| 9.3 | Tenant configuration: corridors, currencies, pricing rules, feature flags confirmed | Product | |
| 9.4 | First test customer registered and onboarded successfully in production | Product | |
| 9.5 | First test payment submitted and completed in production | Product | |

---

## Go-Live Approval

| Approver | Role | Signature | Date |
|---|---|---|---|
| | Product Lead | | |
| | Engineering Lead | | |
| | Compliance Lead | | |
| | Legal | | |

**Go-live is approved only when all items in sections 1–9 are marked complete, or explicitly risk-accepted in writing by the relevant owner and countersigned by the Product Lead.**

---

*Document owner: Engineering Lead — update after each sprint review.*  
*Version: 1.0 — created 2026-04-11*
