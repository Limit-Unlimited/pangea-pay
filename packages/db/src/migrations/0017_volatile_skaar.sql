CREATE TABLE `sanction_entries` (
	`id` varchar(36) NOT NULL,
	`list_id` varchar(36) NOT NULL,
	`source_id` varchar(191) NOT NULL,
	`entry_type` enum('individual','entity','vessel','aircraft','unknown') NOT NULL,
	`primary_name` varchar(500) NOT NULL,
	`aliases` text,
	`dates_of_birth` text,
	`nationalities` text,
	`programmes` text,
	`data` mediumtext NOT NULL,
	`content_hash` char(64) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`first_seen_run_id` varchar(36),
	`last_changed_run_id` varchar(36),
	`removed_run_id` varchar(36),
	`removed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sanction_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `sanction_entries_list_source_idx` UNIQUE(`list_id`,`source_id`)
);
--> statement-breakpoint
CREATE TABLE `sanction_entry_changes` (
	`id` varchar(36) NOT NULL,
	`run_id` varchar(36) NOT NULL,
	`list_id` varchar(36) NOT NULL,
	`entry_id` varchar(36) NOT NULL,
	`source_id` varchar(191) NOT NULL,
	`change_type` enum('added','removed','modified','restored') NOT NULL,
	`primary_name` varchar(500) NOT NULL,
	`changed_fields` text,
	`before` mediumtext,
	`after` mediumtext,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sanction_entry_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sanction_list_runs` (
	`id` varchar(36) NOT NULL,
	`list_id` varchar(36) NOT NULL,
	`trigger` enum('scheduled','manual_fetch','manual_upload') NOT NULL,
	`status` enum('running','success','unchanged','failed','rejected') NOT NULL DEFAULT 'running',
	`triggered_by` varchar(36),
	`forced` boolean NOT NULL DEFAULT false,
	`note` text,
	`file_name` varchar(255),
	`file_hash` char(64),
	`file_bytes` int,
	`source_published_at` varchar(50),
	`entry_count_before` int,
	`entry_count_after` int,
	`added_count` int NOT NULL DEFAULT 0,
	`removed_count` int NOT NULL DEFAULT 0,
	`modified_count` int NOT NULL DEFAULT 0,
	`restored_count` int NOT NULL DEFAULT 0,
	`error_message` text,
	`held_changes` mediumtext,
	`started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`finished_at` timestamp,
	CONSTRAINT `sanction_list_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sanction_lists` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`publisher` varchar(255) NOT NULL,
	`jurisdiction` varchar(10) NOT NULL,
	`source_url` varchar(1000) NOT NULL,
	`info_url` varchar(1000),
	`is_active` boolean NOT NULL DEFAULT true,
	`max_age_hours` int NOT NULL DEFAULT 26,
	`status` enum('never_run','ok','needs_review') NOT NULL DEFAULT 'never_run',
	`last_attempt_at` timestamp,
	`last_success_at` timestamp,
	`last_changed_at` timestamp,
	`last_run_id` varchar(36),
	`last_file_hash` char(64),
	`source_published_at` varchar(50),
	`entry_count` int NOT NULL DEFAULT 0,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sanction_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `sanction_lists_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `sanction_entries` ADD CONSTRAINT `sanction_entries_list_id_sanction_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `sanction_lists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_entry_changes` ADD CONSTRAINT `sanction_entry_changes_run_id_sanction_list_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `sanction_list_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_entry_changes` ADD CONSTRAINT `sanction_entry_changes_list_id_sanction_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `sanction_lists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_entry_changes` ADD CONSTRAINT `sanction_entry_changes_entry_id_sanction_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `sanction_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_list_runs` ADD CONSTRAINT `sanction_list_runs_list_id_sanction_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `sanction_lists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sanction_list_runs` ADD CONSTRAINT `sanction_list_runs_triggered_by_users_id_fk` FOREIGN KEY (`triggered_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sanction_entries_active_idx` ON `sanction_entries` (`is_active`,`list_id`);--> statement-breakpoint
CREATE INDEX `sanction_entry_changes_run_idx` ON `sanction_entry_changes` (`run_id`);--> statement-breakpoint
CREATE INDEX `sanction_entry_changes_entry_idx` ON `sanction_entry_changes` (`entry_id`);--> statement-breakpoint
CREATE INDEX `sanction_list_runs_list_started_idx` ON `sanction_list_runs` (`list_id`,`started_at`);