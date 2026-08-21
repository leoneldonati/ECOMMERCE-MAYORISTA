import type { Availability, Product } from "~/db/types";

// View-model del catálogo expuesto a la UI. En B2C todos ven precios y stock;
// esta capa solo agrega el estado de disponibilidad derivado del producto.

/** Estado de disponibilidad según stock y modo bajo pedido. */
export function availabilityOf(product: Pick<Product, "made_to_order" | "stock">): Availability {
  if (product.made_to_order === 1) return "made_to_order";
  return product.stock > 0 ? "in_stock" : "out_of_stock";
}

export interface CatalogItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  stock: number;
  lead_time_days: number | null;
  availability: Availability;
  category_name: string;
  category_slug: string;
}

export interface CatalogDetail extends CatalogItem {
  made_to_order: number;
}

export function toCatalogItem(product: Product): CatalogItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    image_url: product.image_url,
    price_cents: product.price_cents,
    stock: product.stock,
    lead_time_days: product.lead_time_days,
    availability: availabilityOf(product),
    category_name: product.category_name ?? "",
    category_slug: product.category_slug ?? "",
  };
}

export function toCatalogDetail(product: Product): CatalogDetail {
  return { ...toCatalogItem(product), id: product.id, made_to_order: product.made_to_order };
}
