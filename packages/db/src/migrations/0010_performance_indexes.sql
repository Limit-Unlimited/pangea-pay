-- Sprint 8: Performance indexes on hot-path query columns
-- These compound indexes cover the most frequent WHERE clauses across all three apps.

-- Customers: tenant + status filtering (operations queue, customer list)
CREATE INDEX `idx_customers_tenant_status` ON `customers` (`tenant_id`, `status`);
--> statement-breakpoint
CREATE INDEX `idx_customers_tenant_onboarding` ON `customers` (`tenant_id`, `onboarding_status`);
--> statement-breakpoint

-- Transactions: tenant + customer (transaction history); tenant + status (payment ops queue)
CREATE INDEX `idx_transactions_tenant_customer` ON `transactions` (`tenant_id`, `customer_id`);
--> statement-breakpoint
CREATE INDEX `idx_transactions_tenant_status` ON `transactions` (`tenant_id`, `status`);
--> statement-breakpoint
CREATE INDEX `idx_transactions_tenant_created` ON `transactions` (`tenant_id`, `created_at`);
--> statement-breakpoint

-- FX quotes: customer + status (quote lookup when submitting payment)
CREATE INDEX `idx_fx_quotes_customer_status` ON `fx_quotes` (`customer_id`, `status`);
--> statement-breakpoint

-- Beneficiaries: customer + tenant (beneficiary list)
CREATE INDEX `idx_beneficiaries_customer` ON `beneficiaries` (`customer_id`, `tenant_id`);
--> statement-breakpoint

-- API access tokens: consumer lookup (token validation joins)
CREATE INDEX `idx_api_access_tokens_consumer` ON `api_access_tokens` (`consumer_id`);
--> statement-breakpoint

-- Idempotency keys: composite lookup (consumer + key + endpoint is the hot path)
CREATE INDEX `idx_idempotency_consumer_key_endpoint` ON `idempotency_keys` (`consumer_id`, `idempotency_key`, `endpoint`);
--> statement-breakpoint

-- Webhook events: processing queue (tenant + status + next_retry_at)
CREATE INDEX `idx_webhook_events_queue` ON `webhook_events` (`tenant_id`, `status`, `next_retry_at`);
--> statement-breakpoint

-- Compliance alerts: tenant + status (alert queue)
CREATE INDEX `idx_compliance_alerts_tenant_status` ON `compliance_alerts` (`tenant_id`, `status`);
--> statement-breakpoint

-- Compliance cases: tenant + status (case management)
CREATE INDEX `idx_compliance_cases_tenant_status` ON `compliance_cases` (`tenant_id`, `status`);
--> statement-breakpoint

-- Audit logs: tenant + created_at (audit trail browsing, descending order)
CREATE INDEX `idx_audit_logs_tenant_created` ON `audit_logs` (`tenant_id`, `created_at`);
--> statement-breakpoint

-- Reconciliation items: upload + match status (item filtering)
CREATE INDEX `idx_recon_items_upload_status` ON `reconciliation_items` (`upload_id`, `match_status`);
--> statement-breakpoint

-- Journal lines: journal entry (P&L / balance retrieval)
CREATE INDEX `idx_journal_lines_entry` ON `journal_lines` (`journal_entry_id`);
--> statement-breakpoint
CREATE INDEX `idx_journal_lines_account` ON `journal_lines` (`account_id`);
