import { randomBytes } from "node:crypto";
import { getDb } from "../client.server";
import type { User } from "../types";

// Sesiones: token opaco por cookie HTTP-only, con vencimiento a 30 días.

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/** Crea una sesión y devuelve el token opaco (se guarda en cookie). */
export function createSession(userId: number): string {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  db.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(
    token,
    userId,
    now.toISOString(),
    new Date(now.getTime() + SESSION_TTL_MS).toISOString()
  );
  return token;
}

/**
 * Devuelve el usuario de una sesión vigente; limpia y descarta
 * la sesión si venció.
 */
export function findSessionUser(token: string): User | undefined {
  if (!token) return undefined;
  const db = getDb();
  const session = db
    .prepare("SELECT token, expires_at FROM sessions WHERE token = ?")
    .get(token) as { token: string; expires_at: string } | undefined;
  if (!session) return undefined;
  if (session.expires_at < new Date().toISOString()) {
    deleteSession(token);
    return undefined;
  }
  return db
    .prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?")
    .get(token) as User | undefined;
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/** Limpieza de sesiones vencidas (ideal en un cron o tarea periódica). */
export function deleteExpiredSessions(): void {
  getDb().prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
}