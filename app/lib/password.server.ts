import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Hashing de contraseñas con scrypt + salt (node:crypto, sin dependencias).
// Formato almacenado: "scrypt$<salt hex>$<hash hex>".

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** Genera el hash scrypt de una contraseña en formato "scrypt$salt$hash". */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

/**
 * Verifica una contraseña contra el hash almacenado usando comparación
 * de tiempo constante. Devuelve false ante formatos inválidos.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}