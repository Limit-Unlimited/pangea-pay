ALTER TABLE `customer_screening_results` ADD `beneficiary_id` varchar(36);--> statement-breakpoint
ALTER TABLE `customer_screening_results` ADD `screening_trigger` varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `beneficiaries` ADD `screening_status` enum('not_screened','pending','clear','match','review') DEFAULT 'not_screened' NOT NULL;--> statement-breakpoint
ALTER TABLE `sanction_screening_hits` ADD `beneficiary_id` varchar(36);--> statement-breakpoint
CREATE INDEX `customer_screening_results_subject_idx` ON `customer_screening_results` (`customer_id`,`beneficiary_id`,`screening_type`,`screened_at`);