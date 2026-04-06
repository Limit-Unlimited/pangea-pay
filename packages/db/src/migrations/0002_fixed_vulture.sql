CREATE TABLE `permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`key` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_role_id_permission_id_pk` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `corridors` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`send_country_code` varchar(2) NOT NULL,
	`receive_country_code` varchar(2) NOT NULL,
	`send_currency_code` varchar(3) NOT NULL,
	`receive_currency_code` varchar(3) NOT NULL,
	`min_send_amount` decimal(18,2) NOT NULL DEFAULT '1.00',
	`max_send_amount` decimal(18,2) NOT NULL DEFAULT '5000.00',
	`status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `corridors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`code` varchar(2) NOT NULL,
	`name` varchar(100) NOT NULL,
	`dial_code` varchar(10),
	`currency_code` varchar(3),
	`is_send_enabled` boolean NOT NULL DEFAULT false,
	`is_receive_enabled` boolean NOT NULL DEFAULT false,
	`status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`decimal_places` int NOT NULL DEFAULT 2,
	`status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`key` varchar(100) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`is_enabled` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`),
	CONSTRAINT `feature_flags_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`corridor_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`fee_type` enum('flat','percentage','tiered') NOT NULL DEFAULT 'flat',
	`fee_value` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`fx_markup_percent` decimal(6,4) NOT NULL DEFAULT '0.0000',
	`min_fee` decimal(18,2),
	`max_fee` decimal(18,2),
	`status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`code` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`type` enum('bank_transfer','mobile_money','cash_pickup','wallet','card') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'inactive',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `corridors` ADD CONSTRAINT `corridors_send_country_code_countries_code_fk` FOREIGN KEY (`send_country_code`) REFERENCES `countries`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `corridors` ADD CONSTRAINT `corridors_receive_country_code_countries_code_fk` FOREIGN KEY (`receive_country_code`) REFERENCES `countries`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `corridors` ADD CONSTRAINT `corridors_send_currency_code_currencies_code_fk` FOREIGN KEY (`send_currency_code`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `corridors` ADD CONSTRAINT `corridors_receive_currency_code_currencies_code_fk` FOREIGN KEY (`receive_currency_code`) REFERENCES `currencies`(`code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricing_rules` ADD CONSTRAINT `pricing_rules_corridor_id_corridors_id_fk` FOREIGN KEY (`corridor_id`) REFERENCES `corridors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricing_rules` ADD CONSTRAINT `pricing_rules_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;