import type { Migration } from "../migrate.server";

// Migración 002: carrito de compras persistido por usuario.
// La cantidad se valida > 0 en la DB; UNIQUE(user_id, product_id) evita duplicados
// y ON DELETE CASCADE limpia el carrito si se borra un usuario o un producto.

export const migration: Migration = {
  id: "002_cart",
  description: "Tabla cart_items para el carrito persistido por usuario",
  up: `
CREATE TABLE cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
`,
};