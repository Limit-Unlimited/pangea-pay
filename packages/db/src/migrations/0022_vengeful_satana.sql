CREATE TABLE `pep_name_keys` (
	`person_id` varchar(36) NOT NULL,
	`name_key` varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pep_person_changes` (
	`id` varchar(36) NOT NULL,
	`run_id` varchar(36) NOT NULL,
	`person_id` varchar(36) NOT NULL,
	`source_ref` varchar(191) NOT NULL,
	`change_type` enum('added','removed','modified','restored') NOT NULL,
	`primary_name` varchar(500) NOT NULL,
	`changed_fields` text,
	`before` mediumtext,
	`after` mediumtext,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pep_person_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pep_persons` (
	`id` varchar(36) NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`source_ref` varchar(191) NOT NULL,
	`kind` enum('pep','rca') NOT NULL,
	`primary_name` varchar(500) NOT NULL,
	`top_category` varchar(40),
	`is_current` boolean NOT NULL DEFAULT false,
	`last_position_end` varchar(10),
	`countries` text,
	`names` text,
	`dates_of_birth` text,
	`nationalities` text,
	`data` mediumtext NOT NULL,
	`content_hash` char(64) NOT NULL,
	`source_modified_at` varchar(30),
	`is_active` boolean NOT NULL DEFAULT true,
	`first_seen_run_id` varchar(36),
	`last_changed_run_id` varchar(36),
	`removed_run_id` varchar(36),
	`removed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pep_persons_id` PRIMARY KEY(`id`),
	CONSTRAINT `pep_persons_source_ref_idx` UNIQUE(`source_id`,`source_ref`)
);
--> statement-breakpoint
CREATE TABLE `pep_runs` (
	`id` varchar(36) NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`trigger` enum('scheduled','manual') NOT NULL,
	`status` enum('running','success','unchanged','failed','rejected') NOT NULL DEFAULT 'running',
	`triggered_by` varchar(36),
	`forced` boolean NOT NULL DEFAULT false,
	`note` text,
	`person_count_before` int,
	`person_count_after` int,
	`added_count` int NOT NULL DEFAULT 0,
	`removed_count` int NOT NULL DEFAULT 0,
	`modified_count` int NOT NULL DEFAULT 0,
	`restored_count` int NOT NULL DEFAULT 0,
	`stats` text,
	`error_message` text,
	`held_changes` mediumtext,
	`started_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`finished_at` timestamp(3),
	CONSTRAINT `pep_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pep_sources` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`publisher` varchar(255) NOT NULL,
	`licence` varchar(255) NOT NULL,
	`source_url` varchar(1000) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`max_age_hours` int NOT NULL DEFAULT 26,
	`status` enum('never_run','ok','needs_review') NOT NULL DEFAULT 'never_run',
	`last_attempt_at` timestamp,
	`last_success_at` timestamp,
	`last_changed_at` timestamp,
	`last_run_id` varchar(36),
	`person_count` int NOT NULL DEFAULT 0,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pep_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `pep_sources_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `pep_name_keys` ADD CONSTRAINT `pep_name_keys_person_id_pep_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `pep_persons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pep_person_changes` ADD CONSTRAINT `pep_person_changes_run_id_pep_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `pep_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pep_person_changes` ADD CONSTRAINT `pep_person_changes_person_id_pep_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `pep_persons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pep_persons` ADD CONSTRAINT `pep_persons_source_id_pep_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `pep_sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pep_runs` ADD CONSTRAINT `pep_runs_source_id_pep_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `pep_sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pep_runs` ADD CONSTRAINT `pep_runs_triggered_by_users_id_fk` FOREIGN KEY (`triggered_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pep_name_keys_key_idx` ON `pep_name_keys` (`name_key`);--> statement-breakpoint
CREATE INDEX `pep_name_keys_person_idx` ON `pep_name_keys` (`person_id`);--> statement-breakpoint
CREATE INDEX `pep_person_changes_run_idx` ON `pep_person_changes` (`run_id`);--> statement-breakpoint
CREATE INDEX `pep_person_changes_person_idx` ON `pep_person_changes` (`person_id`);--> statement-breakpoint
CREATE INDEX `pep_persons_active_idx` ON `pep_persons` (`is_active`,`kind`);--> statement-breakpoint
CREATE INDEX `pep_runs_source_started_idx` ON `pep_runs` (`source_id`,`started_at`);