import type { DatabaseSync } from "node:sqlite";

/**
 * Ejecuta una función dentro de una transacción SQLite.
 * Enviada en módulo propio para evitar dependencia circular
 * entre `client.server.ts` y `migrate.server.ts`.
 */
export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}