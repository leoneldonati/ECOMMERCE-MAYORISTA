import type { Migration } from "../migrate.server";

// Migración 005: lista de deseos (favoritos) por usuario.
// UNIQUE(user_id, product_id) evita duplicados; ON DELETE CASCADE limpia los
// favoritos si se borra un usuario o un producto.

export const migration: Migration = {
  id: "005_favorites",
  description: "Tabla favorites para la lista de deseos por usuario",
  up: `
CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
`,
};
