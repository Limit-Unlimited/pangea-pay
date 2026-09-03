import { db } from "./client";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Adding active_customer_id to web_users...");

  await db.execute(sql`
    ALTER TABLE web_users
    ADD COLUMN active_customer_id VARCHAR(36) NULL,
    ADD CONSTRAINT web_users_active_customer_fk
      FOREIGN KEY (active_customer_id) REFERENCES customers(id)
  `);
  console.log("Column added.");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS web_user_customer_links (
      id          VARCHAR(36)  NOT NULL,
      user_id     VARCHAR(36)  NOT NULL,
      customer_id VARCHAR(36)  NOT NULL,
      role        VARCHAR(50)  NOT NULL DEFAULT 'owner',
      is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
      status      ENUM('active','suspended','removed') NOT NULL DEFAULT 'active',
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_customer (user_id, customer_id),
      CONSTRAINT wucl_user_fk     FOREIGN KEY (user_id)     REFERENCES web_users(id) ON DELETE CASCADE,
      CONSTRAINT wucl_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);
  console.log("Junction table ensured.");

  await db.execute(sql`
    INSERT IGNORE INTO web_user_customer_links (id, user_id, customer_id, role, is_primary, status)
    SELECT UUID(), id, customer_id, 'owner', TRUE, 'active'
    FROM web_users
    WHERE customer_id IS NOT NULL
  `);
  console.log("Junction table backfilled.");

  await db.execute(sql`
    UPDATE web_users SET active_customer_id = customer_id WHERE customer_id IS NOT NULL
  `);
  console.log("active_customer_id backfilled.");

  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
