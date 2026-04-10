CREATE TABLE `account_status_history` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`from_status` varchar(30) NOT NULL,
	`to_status` varchar(30) NOT NULL,
	`reason` text,
	`changed_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `account_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`account_number` varchar(30) NOT NULL,
	`account_type` enum('current','wallet') NOT NULL DEFAULT 'current',
	`currency` varchar(3) NOT NULL,
	`status` enum('pending','active','blocked','suspended','closed') NOT NULL DEFAULT 'pending',
	`current_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`available_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`reserved_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`open_date` date,
	`closed_at` timestamp,
	`closed_reason` text,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_account_number_unique` UNIQUE(`account_number`)
);
--> statement-breakpoint
CREATE TABLE `beneficiaries` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`bank_name` varchar(255),
	`account_number` varchar(50),
	`iban` varchar(34),
	`sort_code` varchar(10),
	`swift_bic` varchar(11),
	`currency` varchar(3) NOT NULL,
	`country` varchar(2) NOT NULL,
	`status` enum('active','flagged','blocked') NOT NULL DEFAULT 'active',
	`flag_reason` text,
	`flagged_by` varchar(36),
	`flagged_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beneficiaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phone_verifications` (
	`id` varchar(36) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`otp_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `phone_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `web_user_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`token` varchar(512) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `web_user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `web_user_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `web_users` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36),
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`phone_number` varchar(30),
	`phone_verified` boolean NOT NULL DEFAULT false,
	`password_hash` varchar(255),
	`status` enum('pending_verification','active','suspended','closed') NOT NULL DEFAULT 'pending_verification',
	`tc_version` varchar(50),
	`tc_accepted_at` timestamp,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `web_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `web_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `account_status_history` ADD CONSTRAINT `account_status_history_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_status_history` ADD CONSTRAINT `account_status_history_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_status_history` ADD CONSTRAINT `account_status_history_changed_by_users_id_fk` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD CONSTRAINT `beneficiaries_flagged_by_users_id_fk` FOREIGN KEY (`flagged_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `web_user_sessions` ADD CONSTRAINT `web_user_sessions_user_id_web_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `web_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `web_user_sessions` ADD CONSTRAINT `web_user_sessions_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `web_users` ADD CONSTRAINT `web_users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `web_users` ADD CONSTRAINT `web_users_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;