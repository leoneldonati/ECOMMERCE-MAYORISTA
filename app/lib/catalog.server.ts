import type { ProductWithTiers } from "~/db/types";
import { canSeePrices } from "./access";

// View-model del catálogo expuesto a la UI. Define qué campos llegan al cliente
// según la visibilidad del usuario: para no aprobados los montos nunca se
// serializan (defensa en profundidad), así no hay precios en el HTML.

export interface CatalogItem {
  slug: string;
  name: string;
  description: string | null;
  package_size: string | null;
  unit_label: string;
  category_name: string;
  category_slug: string;
  /** Mejor precio por unidad (mínimo entre escalas), o null sin acceso. */
  from_price_cents: number | null;
  /** Stock en unidades de venta, o null sin acceso. */
  stock: number | null;
}

export interface CatalogTier {
  min_qty: number;
  /** null cuando el usuario no ve precios. */
  price_cents: number | null;
}

export interface CatalogDetail {
  /** ID de BD: lo usa el form de "agregar al carrito" para el POST. */
  id: number;
  slug: string;
  name: string;
  description: string | null;
  package_size: string | null;
  unit_label: string;
  category_name: string;
  category_slug: string;
  stock: number | null;
  tiers: CatalogTier[];
  canSeePrices: boolean;
}

export interface CatalogUserData {
  /** null = puede ver precios; si no, `visitor | pending | rejected`. */
  pricesNotice: "visitor" | "pending" | "rejected" | null;
  canSeePrices: boolean;
}

/** Deriva estado y visibilidad de precios para la UI según el usuario. */
export function catalogVisibility(user: Parameters<typeof canSeePrices>[0]): CatalogUserData {
  const visible = canSeePrices(user);
  const pricesNotice: CatalogUserData["pricesNotice"] = visible
    ? null
    : !user
      ? "visitor"
      : user.status === "rejected"
        ? "rejected"
        : "pending";
  return { pricesNotice, canSeePrices: visible };
}

export function toCatalogItem(product: ProductWithTiers, canSeePrices: boolean): CatalogItem {
  const from =
    canSeePrices && product.tiers.length > 0
      ? Math.min(...product.tiers.map((tier) => tier.price_cents))
      : null;
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    package_size: product.package_size,
    unit_label: product.unit_label,
    category_name: product.category_name ?? "",
    category_slug: product.category_slug ?? "",
    from_price_cents: from,
    stock: canSeePrices ? product.stock : null,
  };
}

export function toCatalogDetail(
  product: ProductWithTiers,
  canSeePrices: boolean,
): CatalogDetail {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    package_size: product.package_size,
    unit_label: product.unit_label,
    category_name: product.category_name ?? "",
    category_slug: product.category_slug ?? "",
    stock: canSeePrices ? product.stock : null,
    tiers: product.tiers.map((tier) => ({
      min_qty: tier.min_qty,
      price_cents: canSeePrices ? tier.price_cents : null,
    })),
    canSeePrices,
  };
}