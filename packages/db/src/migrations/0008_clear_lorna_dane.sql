CREATE TABLE `compliance_alerts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`alert_ref` varchar(30) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36),
	`rule_code` varchar(100) NOT NULL,
	`rule_name` varchar(255) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','under_review','cleared','escalated','closed') NOT NULL DEFAULT 'open',
	`trigger_details` text,
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp,
	`review_notes` text,
	`closed_by` varchar(36),
	`closed_at` timestamp,
	`case_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_alerts_alert_ref_unique` UNIQUE(`alert_ref`)
);
--> statement-breakpoint
CREATE TABLE `compliance_case_notes` (
	`id` varchar(36) NOT NULL,
	`case_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`author_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_case_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_cases` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`case_ref` varchar(30) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('open','under_investigation','closed','escalated_to_sar') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assigned_to` varchar(36),
	`sar_reference` varchar(100),
	`sar_filed_at` timestamp,
	`sar_filed_by` varchar(36),
	`opened_by` varchar(36),
	`opened_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`closed_by` varchar(36),
	`closed_at` timestamp,
	`closure_notes` text,
	`due_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_cases_case_ref_unique` UNIQUE(`case_ref`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_rules` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`rule_type` enum('single_transaction_limit','velocity_count','velocity_amount','high_risk_corridor','pep_screening') NOT NULL,
	`threshold_amount` decimal(18,4),
	`threshold_currency` varchar(3),
	`threshold_count` int,
	`window_hours` int,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_rules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `nostro_accounts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`account_ref` varchar(30) NOT NULL,
	`bank_name` varchar(255) NOT NULL,
	`bank_country` varchar(2) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`account_number` varchar(50),
	`iban` varchar(50),
	`swift_bic` varchar(15),
	`sort_code` varchar(10),
	`book_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`value_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`is_safeguarded` enum('yes','no') NOT NULL DEFAULT 'no',
	`status` enum('active','inactive','dormant') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nostro_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `nostro_accounts_account_ref_unique` UNIQUE(`account_ref`)
);
--> statement-breakpoint
CREATE TABLE `nostro_entries` (
	`id` varchar(36) NOT NULL,
	`nostro_account_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`entry_ref` varchar(60),
	`value_date` timestamp NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`running_balance` decimal(18,4) NOT NULL,
	`description` varchar(500),
	`transaction_id` varchar(36),
	`is_reconciled` enum('yes','no') NOT NULL DEFAULT 'no',
	`reconciled_at` timestamp,
	`reconciled_by` varchar(36),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `nostro_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prefunding_records` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nostro_account_id` varchar(36) NOT NULL,
	`prefund_ref` varchar(30) NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`value_date` timestamp NOT NULL,
	`status` enum('received','allocated','refunded') NOT NULL DEFAULT 'received',
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prefunding_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `prefunding_records_prefund_ref_unique` UNIQUE(`prefund_ref`)
);
--> statement-breakpoint
CREATE TABLE `chart_of_accounts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`account_type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`sub_type` varchar(100),
	`currency` varchar(3),
	`parent_id` varchar(36),
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chart_of_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`entry_ref` varchar(30) NOT NULL,
	`entry_date` timestamp NOT NULL,
	`description` varchar(500) NOT NULL,
	`entry_type` enum('payment','fee','fx_gain_loss','prefunding','correction','manual') NOT NULL,
	`transaction_id` varchar(36),
	`status` enum('draft','posted','reversed') NOT NULL DEFAULT 'draft',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`reversed_at` timestamp,
	`reversed_by` varchar(36),
	`reversal_of` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entries_entry_ref_unique` UNIQUE(`entry_ref`)
);
--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` varchar(36) NOT NULL,
	`journal_entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`side` enum('debit','credit') NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`base_amount` decimal(18,4),
	`base_currency` varchar(3),
	`fx_rate` decimal(18,8),
	`description` varchar(255),
	`line_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `journal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_closed_by_users_id_fk` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_case_notes` ADD CONSTRAINT `compliance_case_notes_case_id_compliance_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `compliance_cases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_case_notes` ADD CONSTRAINT `compliance_case_notes_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_sar_filed_by_users_id_fk` FOREIGN KEY (`sar_filed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_opened_by_users_id_fk` FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_cases` ADD CONSTRAINT `compliance_cases_closed_by_users_id_fk` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_rules` ADD CONSTRAINT `monitoring_rules_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nostro_accounts` ADD CONSTRAINT `nostro_accounts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nostro_entries` ADD CONSTRAINT `nostro_entries_nostro_account_id_nostro_accounts_id_fk` FOREIGN KEY (`nostro_account_id`) REFERENCES `nostro_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nostro_entries` ADD CONSTRAINT `nostro_entries_reconciled_by_users_id_fk` FOREIGN KEY (`reconciled_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nostro_entries` ADD CONSTRAINT `nostro_entries_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prefunding_records` ADD CONSTRAINT `prefunding_records_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prefunding_records` ADD CONSTRAINT `prefunding_records_nostro_account_id_nostro_accounts_id_fk` FOREIGN KEY (`nostro_account_id`) REFERENCES `nostro_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prefunding_records` ADD CONSTRAINT `prefunding_records_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chart_of_accounts` ADD CONSTRAINT `chart_of_accounts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_posted_by_users_id_fk` FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_reversed_by_users_id_fk` FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_lines` ADD CONSTRAINT `journal_lines_journal_entry_id_journal_entries_id_fk` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_lines` ADD CONSTRAINT `journal_lines_account_id_chart_of_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE no action ON UPDATE no action;