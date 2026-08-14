import type { Migration } from "../migrate.server";

// Migración 004: reconversión del modelo a ecommerce de productos impresos 3D (B2C).
// users pasa a registro abierto (sin CUIT/razón social/aprobación), products a
// precio único + imagen + fabricación bajo pedido, y se elimina price_tiers.
// Se usa ADD/DROP COLUMN (SQLite >= 3.35) y se recrea `users` porque sus
// constraints (UNIQUE cuit, índices) impiden borrar columnas en el lugar.

export const migration: Migration = {
  id: "004_3d",
  description:
    "Reconversión a ecommerce de impresión 3D: users B2C, products con precio único e imagen, drop price_tiers",
  up: `
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  name TEXT NOT NULL,
  phone TEXT,
  province TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO users_new (id, email, password_hash, role, status, name, phone, province, address, created_at, updated_at)
  SELECT id, email, password_hash, role, status, COALESCE(business_name, email), phone, province, address, created_at, updated_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

ALTER TABLE products ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0);
ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products ADD COLUMN lead_time_days INTEGER;
ALTER TABLE products ADD COLUMN made_to_order INTEGER NOT NULL DEFAULT 0 CHECK (made_to_order IN (0,1));

UPDATE products SET price_cents = COALESCE((SELECT MIN(price_cents) FROM price_tiers WHERE price_tiers.product_id = products.id), 0);

ALTER TABLE products DROP COLUMN unit_label;
ALTER TABLE products DROP COLUMN package_size;

DROP TABLE price_tiers;

ALTER TABLE order_items ADD COLUMN image_url TEXT;
ALTER TABLE order_items DROP COLUMN unit_label;
ALTER TABLE order_items DROP COLUMN package_size;
`,
};
