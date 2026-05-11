CREATE TABLE `team_invitations` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`invited_by_user_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'standard',
	`token` varchar(64) NOT NULL,
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `team_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `team_invitations` ADD CONSTRAINT `team_invitations_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_invitations` ADD CONSTRAINT `team_invitations_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_invitations` ADD CONSTRAINT `team_invitations_invited_by_user_id_web_users_id_fk` FOREIGN KEY (`invited_by_user_id`) REFERENCES `web_users`(`id`) ON DELETE no action ON UPDATE no action;
