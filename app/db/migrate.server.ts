import type { DatabaseSync } from "node:sqlite";
import { withTransaction } from "./transaction.server";
import { migration as initial } from "./migrations/001_initial";
import { migration as cart } from "./migrations/002_cart";
import { migration as paymentNotification } from "./migrations/003_payment_notification";

// Cada migración aporta un id estable, una descripción y el SQL a aplicar.
// Se aplican en orden de aparición y se registran en la tabla `_migrations`.

export interface Migration {
  id: string;
  description: string;
  up: string;
}

const migrations: Migration[] = [initial, cart, paymentNotification];

/**
 * Aplica las migraciones pendientes en orden, cada una dentro de
 * una transacción. Es idempotente: solo corre las que falten.
 */
export function runMigrations(db: DatabaseSync): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  );
  const applied = new Set(
    (db.prepare("SELECT id FROM _migrations").all() as { id: string }[]).map((row) => row.id),
  );
  const record = db.prepare("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)");
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    withTransaction(db, () => {
      db.exec(migration.up);
      record.run(migration.id, new Date().toISOString());
    });
    console.log(`[migrate] aplicada: ${migration.id} — ${migration.description}`);
  }
}
