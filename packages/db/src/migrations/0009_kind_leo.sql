CREATE TABLE `api_access_tokens` (
	`id` varchar(36) NOT NULL,
	`consumer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`scopes` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `api_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_access_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `api_consumers` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`consumer_ref` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`client_id` varchar(64) NOT NULL,
	`client_secret_hash` varchar(255) NOT NULL,
	`status` enum('active','suspended','revoked') NOT NULL DEFAULT 'active',
	`scopes` text NOT NULL DEFAULT ('quotes:read payments:write payments:read'),
	`rate_limit_per_min` int NOT NULL DEFAULT 60,
	`webhook_url` varchar(500),
	`webhook_secret` varchar(255),
	`environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_consumers_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_consumers_consumer_ref_unique` UNIQUE(`consumer_ref`),
	CONSTRAINT `api_consumers_client_id_unique` UNIQUE(`client_id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`id` varchar(36) NOT NULL,
	`consumer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`idempotency_key` varchar(255) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`response_status` int NOT NULL,
	`response_body` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `idempotency_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_items` (
	`id` varchar(36) NOT NULL,
	`upload_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`value_date` varchar(20),
	`direction` enum('credit','debit'),
	`amount` varchar(30),
	`currency` varchar(3),
	`reference` varchar(255),
	`description` varchar(500),
	`match_status` enum('matched','unmatched','manually_matched','excluded') NOT NULL DEFAULT 'unmatched',
	`matched_transaction_id` varchar(36),
	`matched_at` timestamp,
	`matched_by` varchar(36),
	`row_number` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reconciliation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_uploads` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`upload_ref` varchar(30) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_type` enum('csv','mt940','camt053') NOT NULL DEFAULT 'csv',
	`nostro_account_id` varchar(36),
	`status` enum('processing','processed','failed') NOT NULL DEFAULT 'processing',
	`total_rows` int NOT NULL DEFAULT 0,
	`matched_rows` int NOT NULL DEFAULT 0,
	`unmatched_rows` int NOT NULL DEFAULT 0,
	`processed_at` timestamp,
	`uploaded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reconciliation_uploads_id` PRIMARY KEY(`id`),
	CONSTRAINT `reconciliation_uploads_upload_ref_unique` UNIQUE(`upload_ref`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` varchar(36) NOT NULL,
	`consumer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`resource_id` varchar(36) NOT NULL,
	`payload` text NOT NULL,
	`status` enum('pending','delivered','failed','abandoned') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 5,
	`last_attempt_at` timestamp,
	`next_retry_at` timestamp,
	`delivered_at` timestamp,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `api_access_tokens` ADD CONSTRAINT `api_access_tokens_consumer_id_api_consumers_id_fk` FOREIGN KEY (`consumer_id`) REFERENCES `api_consumers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_consumers` ADD CONSTRAINT `api_consumers_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `idempotency_keys` ADD CONSTRAINT `idempotency_keys_consumer_id_api_consumers_id_fk` FOREIGN KEY (`consumer_id`) REFERENCES `api_consumers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reconciliation_items` ADD CONSTRAINT `reconciliation_items_upload_id_reconciliation_uploads_id_fk` FOREIGN KEY (`upload_id`) REFERENCES `reconciliation_uploads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reconciliation_uploads` ADD CONSTRAINT `reconciliation_uploads_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_events` ADD CONSTRAINT `webhook_events_consumer_id_api_consumers_id_fk` FOREIGN KEY (`consumer_id`) REFERENCES `api_consumers`(`id`) ON DELETE no action ON UPDATE no action;