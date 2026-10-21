CREATE TABLE `sanction_screening_hits` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`screening_result_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`entry_id` varchar(36) NOT NULL,
	`list_code` varchar(50) NOT NULL,
	`source_id` varchar(191) NOT NULL,
	`entry_name` varchar(500) NOT NULL,
	`matched_name` varchar(500) NOT NULL,
	`query_name` varchar(500) NOT NULL,
	`entry_content_hash` char(64) NOT NULL,
	`score` int NOT NULL,
	`name_score` int NOT NULL,
	`dob_comparison` enum('match','same_year','close','differs','unknown') NOT NULL,
	`country_comparison` enum('match','differs','unknown') NOT NULL,
	`decision` enum('pending','false_positive','true_match') NOT NULL DEFAULT 'pending',
	`decision_note` text,
	`decided_by` varchar(36),
	`decided_at` timestamp,
	`carried_from_hit_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sanction_screening_hits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD CONSTRAINT `ssh_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD CONSTRAINT `ssh_result_fk` FOREIGN KEY (`screening_result_id`) REFERENCES `customer_screening_results`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD CONSTRAINT `ssh_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD CONSTRAINT `ssh_entry_fk` FOREIGN KEY (`entry_id`) REFERENCES `sanction_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD CONSTRAINT `ssh_decided_by_fk` FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sanction_screening_hits_result_idx` ON `sanction_screening_hits` (`screening_result_id`);--> statement-breakpoint
CREATE INDEX `sanction_screening_hits_customer_entry_idx` ON `sanction_screening_hits` (`customer_id`,`entry_id`);