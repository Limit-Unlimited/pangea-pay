CREATE TABLE `fx_quotes` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`base_currency` varchar(3) NOT NULL,
	`quote_currency` varchar(3) NOT NULL,
	`rate` decimal(18,8) NOT NULL,
	`send_amount` decimal(18,4) NOT NULL,
	`receive_amount` decimal(18,4) NOT NULL,
	`fee` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`rate_date` varchar(10) NOT NULL,
	`rate_source` varchar(50) NOT NULL DEFAULT 'frankfurter',
	`status` enum('pending','accepted','expired','used') NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`accepted_at` timestamp,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fx_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fx_quotes` ADD CONSTRAINT `fx_quotes_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fx_quotes` ADD CONSTRAINT `fx_quotes_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;