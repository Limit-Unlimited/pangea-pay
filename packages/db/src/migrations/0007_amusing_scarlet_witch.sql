CREATE TABLE `transaction_status_history` (
	`id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`from_status` varchar(30),
	`to_status` varchar(30) NOT NULL,
	`reason` text,
	`performed_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`reference_number` varchar(30) NOT NULL,
	`type` enum('send','receive','convert','refund','fee') NOT NULL,
	`status` enum('initiated','pending','processing','on_hold','completed','failed','cancelled','refunded') NOT NULL DEFAULT 'initiated',
	`from_account_id` varchar(36),
	`beneficiary_id` varchar(36),
	`send_amount` decimal(18,4) NOT NULL,
	`send_currency` varchar(3) NOT NULL,
	`receive_amount` decimal(18,4),
	`receive_currency` varchar(3),
	`fx_rate` decimal(18,8),
	`fx_quote_id` varchar(36),
	`fee` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`fee_currency` varchar(3) NOT NULL,
	`payout_method` varchar(50),
	`purpose_code` varchar(50),
	`customer_ref` varchar(100),
	`provider_ref` varchar(100),
	`provider_name` varchar(50) NOT NULL DEFAULT 'mock',
	`hold_reason` text,
	`held_at` timestamp,
	`held_by` varchar(36),
	`released_at` timestamp,
	`released_by` varchar(36),
	`completed_at` timestamp,
	`failed_at` timestamp,
	`failure_reason` text,
	`cancelled_at` timestamp,
	`cancellation_reason` text,
	`is_duplicate` boolean NOT NULL DEFAULT false,
	`duplicate_of` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
ALTER TABLE `transaction_status_history` ADD CONSTRAINT `transaction_status_history_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_status_history` ADD CONSTRAINT `transaction_status_history_performed_by_users_id_fk` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_from_account_id_accounts_id_fk` FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_held_by_users_id_fk` FOREIGN KEY (`held_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_released_by_users_id_fk` FOREIGN KEY (`released_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;