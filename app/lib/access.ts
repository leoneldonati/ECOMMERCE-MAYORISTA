import type { PublicUser } from "~/db/types";

// Regla de acceso al catálogo (pura, compartida cliente/servidor, sin acceso a DB).
// Solo los clientes aprobados o el admin ven precios mayoristas y stock.

/** True si el usuario puede ver precios y stock del catálogo. */
export function canSeePrices(user: PublicUser | null): boolean {
  return user !== null && (user.role === "admin" || user.status === "approved");
}
