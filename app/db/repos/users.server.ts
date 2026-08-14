import { getDb } from "../client.server";
import type { PublicUser, Role, User, UserStatus } from "../types";

// Repositorio de usuarios. Devuelve filas completas; la capa de auth
// expone `PublicUser` (sin password_hash) hacia las rutas.

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  province?: string;
  address?: string;
  role?: Role;
  status?: UserStatus;
}

/** Crea un cliente. Por defecto queda `customer` / `approved` (B2C sin aprobación). */
export function createUser(input: CreateUserInput): User {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO users
        (email, password_hash, role, status, name, phone, province, address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.email,
      input.passwordHash,
      input.role ?? "customer",
      input.status ?? "approved",
      input.name,
      input.phone ?? null,
      input.province ?? null,
      input.address ?? null,
      now,
      now,
    );
  return findUserById(Number(result.lastInsertRowid))!;
}

export function findUserById(id: number): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function findUserByEmail(email: string): User | undefined {
  // NOCASE está declarado en la columna; pasar minúsculas por claridad.
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as
    User | undefined;
}

export function listUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all() as unknown as User[];
}

/** Elimina la información sensible y devuelve el usuario seguro para exponer. */
export function toPublicUser(user: User): PublicUser {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
