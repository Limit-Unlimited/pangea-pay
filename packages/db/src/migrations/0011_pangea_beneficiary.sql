-- Sprint 9: Add pangea_account_id to beneficiaries for internal Pangea-to-Pangea transfers
ALTER TABLE `beneficiaries`
  ADD COLUMN `pangea_account_id` varchar(36) NULL REFERENCES `accounts`(`id`);
--> statement-breakpoint
CREATE INDEX `idx_beneficiaries_pangea_account` ON `beneficiaries` (`pangea_account_id`);
