CREATE TABLE `commissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`commission_type` enum('fixed','percentage','tiered') NOT NULL,
	`rate` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`currency` varchar(3),
	`effective_date` date NOT NULL,
	`expiry_date` date,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_documents` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`document_type` enum('passport','national_id','driving_licence','proof_of_address','company_registration','certificate_of_incorporation','bank_statement','utility_bill','other') NOT NULL,
	`document_number` varchar(100),
	`issuing_country` varchar(2),
	`issue_date` date,
	`expiry_date` date,
	`file_key` varchar(500),
	`file_name` varchar(255),
	`file_mime_type` varchar(100),
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp,
	`rejection_reason` text,
	`uploaded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_linked_users` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(30),
	`role` varchar(100) NOT NULL DEFAULT 'standard',
	`status` enum('active','suspended','removed') NOT NULL DEFAULT 'active',
	`added_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_linked_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_risk_assessments` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`risk_category` enum('low','medium','high') NOT NULL,
	`score` int,
	`notes` text,
	`next_review_due` date,
	`assessed_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customer_risk_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_screening_results` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`provider` varchar(100) NOT NULL DEFAULT 'mock',
	`screening_type` enum('sanctions','pep','adverse_media','internal_watchlist') NOT NULL,
	`status` enum('clear','pending','match','review') NOT NULL DEFAULT 'pending',
	`match_details` text,
	`notes` text,
	`screened_by` varchar(36),
	`screened_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customer_screening_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`customer_ref` varchar(30) NOT NULL,
	`type` enum('individual','business') NOT NULL,
	`status` enum('prospect','onboarding','active','suspended','closed','archived') NOT NULL DEFAULT 'prospect',
	`onboarding_status` enum('pending','under_review','approved','rejected') NOT NULL DEFAULT 'pending',
	`risk_category` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`segment` varchar(100),
	`first_name` varchar(100),
	`last_name` varchar(100),
	`date_of_birth` date,
	`nationality` varchar(2),
	`country_of_residence` varchar(2),
	`occupation` varchar(150),
	`employer_name` varchar(200),
	`legal_entity_name` varchar(255),
	`trading_name` varchar(255),
	`registration_number` varchar(100),
	`incorporation_country` varchar(2),
	`incorporation_date` date,
	`business_type` varchar(100),
	`business_sector` varchar(150),
	`email` varchar(255),
	`phone` varchar(30),
	`address_line1` varchar(255),
	`address_line2` varchar(255),
	`city` varchar(100),
	`post_code` varchar(20),
	`country` varchar(2),
	`source_of_funds` varchar(150),
	`screening_status` enum('not_screened','pending','clear','match','review') NOT NULL DEFAULT 'not_screened',
	`next_review_due` date,
	`is_blacklisted` boolean NOT NULL DEFAULT false,
	`blacklist_reason` text,
	`blacklisted_at` timestamp,
	`blacklisted_by` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_customer_ref_unique` UNIQUE(`customer_ref`)
);
--> statement-breakpoint
CREATE TABLE `sar_records` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`sar_ref` varchar(30) NOT NULL,
	`type` enum('internal','external') NOT NULL DEFAULT 'internal',
	`status` enum('draft','submitted','closed') NOT NULL DEFAULT 'draft',
	`description` text NOT NULL,
	`notes` text,
	`closed_at` timestamp,
	`closed_by` varchar(36),
	`closed_reason` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sar_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `sar_records_sar_ref_unique` UNIQUE(`sar_ref`)
);
--> statement-breakpoint
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_linked_users` ADD CONSTRAINT `customer_linked_users_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_linked_users` ADD CONSTRAINT `customer_linked_users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_linked_users` ADD CONSTRAINT `customer_linked_users_added_by_users_id_fk` FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_risk_assessments` ADD CONSTRAINT `customer_risk_assessments_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_risk_assessments` ADD CONSTRAINT `customer_risk_assessments_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_risk_assessments` ADD CONSTRAINT `customer_risk_assessments_assessed_by_users_id_fk` FOREIGN KEY (`assessed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_screening_results` ADD CONSTRAINT `customer_screening_results_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_screening_results` ADD CONSTRAINT `customer_screening_results_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_screening_results` ADD CONSTRAINT `customer_screening_results_screened_by_users_id_fk` FOREIGN KEY (`screened_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_blacklisted_by_users_id_fk` FOREIGN KEY (`blacklisted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sar_records` ADD CONSTRAINT `sar_records_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sar_records` ADD CONSTRAINT `sar_records_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sar_records` ADD CONSTRAINT `sar_records_closed_by_users_id_fk` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sar_records` ADD CONSTRAINT `sar_records_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;