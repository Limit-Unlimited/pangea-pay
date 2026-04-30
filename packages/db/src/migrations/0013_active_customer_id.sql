-- Migration 0013: add active_customer_id to web_users and backfill
-- Separate from 0012 because Drizzle marked 0012 applied after CREATE TABLE succeeded.

ALTER TABLE `web_users` ADD COLUMN `active_customer_id` varchar(36);
--> statement-breakpoint

ALTER TABLE `web_users` ADD CONSTRAINT `web_users_active_customer_fk`
  FOREIGN KEY (`active_customer_id`) REFERENCES `customers` (`id`);
--> statement-breakpoint

-- Ensure web_user_customer_links exists (CREATE TABLE IF NOT EXISTS is safe to re-run)
CREATE TABLE IF NOT EXISTS `web_user_customer_links` (
  `id`          varchar(36)                             NOT NULL,
  `user_id`     varchar(36)                             NOT NULL,
  `customer_id` varchar(36)                             NOT NULL,
  `role`        varchar(50)                             NOT NULL DEFAULT 'owner',
  `is_primary`  boolean                                 NOT NULL DEFAULT false,
  `status`      enum('active','suspended','removed')    NOT NULL DEFAULT 'active',
  `created_at`  timestamp                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_customer` (`user_id`,`customer_id`),
  CONSTRAINT `wucl_user_fk`     FOREIGN KEY (`user_id`)     REFERENCES `web_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wucl_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`  (`id`)
);
--> statement-breakpoint

-- Backfill junction table (INSERT IGNORE skips rows already present)
INSERT IGNORE INTO `web_user_customer_links` (`id`, `user_id`, `customer_id`, `role`, `is_primary`, `status`)
SELECT UUID(), `id`, `customer_id`, 'owner', true, 'active'
FROM `web_users`
WHERE `customer_id` IS NOT NULL;
--> statement-breakpoint

-- Set active_customer_id for all existing users
UPDATE `web_users` SET `active_customer_id` = `customer_id` WHERE `customer_id` IS NOT NULL;
