CREATE TABLE `utility_bill_validations` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`biller_code` varchar(50) NOT NULL,
	`biller_account_no` varchar(100) NOT NULL,
	`bill_amount` varchar(30),
	`provider_name` varchar(50) NOT NULL DEFAULT 'mock',
	`conversation_id` varchar(100),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `utility_bill_validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `utility_billers` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`biller_code` varchar(50) NOT NULL,
	`biller_name` varchar(150) NOT NULL,
	`country` varchar(2) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `utility_billers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `gender` enum('M','F','N');--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `beneficiary_gender` enum('M','F','N');--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `beneficiary_occupation` varchar(150);--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `payout_type` enum('bank_account','cash_pickup','wallet','utility_biller') DEFAULT 'bank_account' NOT NULL;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `bank_routing_number` varchar(20);--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `bank_transfer_channel` enum('internal','beftn','rtgs','npsb');--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `wallet_provider` varchar(30);--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `wallet_msisdn` varchar(20);--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `utility_biller_code` varchar(50);--> statement-breakpoint
ALTER TABLE `transactions` ADD `remit_type` enum('WE01','SR02','UR03','GR04');--> statement-breakpoint
ALTER TABLE `transactions` ADD `beneficiary_relationship` varchar(50);--> statement-breakpoint
ALTER TABLE `transactions` ADD `provider_metadata` text;--> statement-breakpoint
ALTER TABLE `utility_bill_validations` ADD CONSTRAINT `utility_bill_validations_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `utility_bill_validations` ADD CONSTRAINT `utility_bill_validations_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `utility_billers` ADD CONSTRAINT `utility_billers_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;