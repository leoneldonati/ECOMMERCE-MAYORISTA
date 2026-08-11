import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "./migrate.server";

// Singleton de conexión cacheado en globalThis: en dev con HMR la conexión
// sobrevive a los recargos de módulos y no se reabre la base en cada request.
const globalRef = globalThis as unknown as { __mayoristaDb?: DatabaseSync };

const NEW_DB_PRAGMAS = [
  "PRAGMA journal_mode = WAL;",
  "PRAGMA foreign_keys = ON;",
  "PRAGMA busy_timeout = 5000;",
];

/** Resuelve la ruta del archivo de base de datos (sobreescribible con DATABASE_PATH). */
export function getDbFilePath(): string {
  return process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "app.db");
}

/**
 * Devuelve la conexión SQLite, aplicando migraciones pendientes la primera vez.
 * Solo código de servidor (archivos *.server.ts y scripts) debe llamarla.
 */
export function getDb(): DatabaseSync {
  if (globalRef.__mayoristaDb) return globalRef.__mayoristaDb;
  const dbPath = getDbFilePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  for (const pragma of NEW_DB_PRAGMAS) db.exec(pragma);
  runMigrations(db);
  globalRef.__mayoristaDb = db;
  return db;
}