CREATE TABLE `team_invitations` (
  `id`                  VARCHAR(36)   NOT NULL,
  `tenant_id`           VARCHAR(36)   NOT NULL,
  `customer_id`         VARCHAR(36)   NOT NULL,
  `invited_by_user_id`  VARCHAR(36)   NOT NULL,
  `email`               VARCHAR(255)  NOT NULL,
  `role`                VARCHAR(50)   NOT NULL DEFAULT 'standard',
  `token`               VARCHAR(64)   NOT NULL,
  `status`              ENUM('pending','accepted','expired') NOT NULL DEFAULT 'pending',
  `expires_at`          TIMESTAMP     NOT NULL,
  `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_inv_token` (`token`),
  CONSTRAINT `team_inv_tenant_fk`   FOREIGN KEY (`tenant_id`)          REFERENCES `tenants`    (`id`),
  CONSTRAINT `team_inv_customer_fk` FOREIGN KEY (`customer_id`)        REFERENCES `customers`  (`id`),
  CONSTRAINT `team_inv_user_fk`     FOREIGN KEY (`invited_by_user_id`) REFERENCES `web_users`  (`id`)
);
