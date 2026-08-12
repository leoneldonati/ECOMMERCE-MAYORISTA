import { getDb } from "../client.server";
import type { CustomerType, PublicUser, Role, User, UserStatus } from "../types";

// Repositorio de usuarios. Devuelve filas completas; la capa de auth
// expone `PublicUser` (sin password_hash) hacia las rutas.

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  businessName: string;
  cuit: string;
  contactName?: string;
  phone?: string;
  province?: string;
  address?: string;
  customerType?: CustomerType;
  role?: Role;
  status?: UserStatus;
}

/** Crea un cliente. Por defecto queda `customer` / `pending` esperando aprobación. */
export function createUser(input: CreateUserInput): User {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO users
        (email, password_hash, role, status, business_name, cuit, contact_name, phone, province, address, customer_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.email,
      input.passwordHash,
      input.role ?? "customer",
      input.status ?? "pending",
      input.businessName,
      input.cuit,
      input.contactName ?? null,
      input.phone ?? null,
      input.province ?? null,
      input.address ?? null,
      input.customerType ?? null,
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

export function listUsers(status?: UserStatus): User[] {
  if (status) {
    return getDb()
      .prepare("SELECT * FROM users WHERE status = ? ORDER BY created_at DESC")
      .all(status) as unknown as User[];
  }
  return getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all() as unknown as User[];
}

/** Cambia el estado de aprobación, registrando el timestamp correspondiente. */
export function setUserStatus(id: number, status: UserStatus): User | undefined {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE users
       SET status = ?, approved_at = ?, rejected_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(status, status === "approved" ? now : null, status === "rejected" ? now : null, now, id);
  return findUserById(id);
}

/** Elimina la información sensible y devuelve el usuario seguro para exponer. */
export function toPublicUser(user: User): PublicUser {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
