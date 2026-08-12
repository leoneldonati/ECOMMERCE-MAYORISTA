import type { SQLInputValue } from "node:sqlite";
import { getDb } from "../client.server";
import { withTransaction } from "../transaction.server";
import type { PriceTier, Product, ProductWithTiers } from "../types";

// Repositorio de productos y sus escalas de precio (price_tiers).

export interface ProductFilters {
  categorySlug?: string;
  activeOnly?: boolean;
  search?: string;
}

export interface CreateProductInput {
  categoryId: number;
  slug: string;
  name: string;
  description?: string;
  unitLabel?: string;
  packageSize?: string;
  stock?: number;
  active?: boolean;
}

export interface UpdateProductInput {
  categoryId?: number;
  slug?: string;
  name?: string;
  description?: string | null;
  unitLabel?: string;
  packageSize?: string | null;
  stock?: number;
  active?: boolean;
}

export interface TierInput {
  minQty: number;
  priceCents: number;
}

// Reemplazos SQL para ignorar acentos en la búsqueda (á→a, é→e, …).
const DEACCENT_MAP: Record<string, string> = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  à: "a",
  è: "e",
  ì: "i",
  ò: "o",
  ù: "u",
  ä: "a",
  ö: "o",
  ü: "u",
  ñ: "n",
};

/** Envuelve una columna en REPLACE encadenados normalizando minúsculas y acentos. */
function deaccent(expr: string): string {
  let out = `LOWER(${expr})`;
  for (const [accented, plain] of Object.entries(DEACCENT_MAP)) {
    out = `REPLACE(${out}, '${accented}', '${plain}')`;
  }
  return out;
}

/** Normaliza el término buscado igual que deaccent(): minúsculas y sin diacríticos. */
function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const PRODUCT_COLUMN_MAP: Record<keyof UpdateProductInput, string> = {
  categoryId: "category_id",
  slug: "slug",
  name: "name",
  description: "description",
  unitLabel: "unit_label",
  packageSize: "package_size",
  stock: "stock",
  active: "active",
};

export function listProducts(filters: ProductFilters = {}): ProductWithTiers[] {
  const db = getDb();
  const where: string[] = [];
  const params: SQLInputValue[] = [];

  if (filters.activeOnly) where.push("p.active = 1");
  if (filters.categorySlug) {
    where.push("c.slug = ?");
    params.push(filters.categorySlug);
  }
  const search = normalizeSearch(filters.search ?? "");
  if (search) {
    // Ambos lados normalizados (acentos + mayúsculas) para que "cafe" encuentre "Café".
    where.push(`(${deaccent("p.name")} LIKE ? OR (${deaccent("p.description")} LIKE ?))`);
    params.push(`%${search}%`, `%${search}%`);
  }
  const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id${whereSql}
       ORDER BY p.name`,
    )
    .all(...params) as unknown as Product[];
  return attachTiers(rows);
}

export function findProductBySlug(slug: string): ProductWithTiers | undefined {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ?`,
    )
    .get(slug) as Product | undefined;
  if (!row) return undefined;
  return attachTiers([row])[0];
}

export function findProductById(id: number): Product | undefined {
  return getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined;
}

export function listTiersForProduct(productId: number): PriceTier[] {
  return getDb()
    .prepare("SELECT * FROM price_tiers WHERE product_id = ? ORDER BY min_qty")
    .all(productId) as unknown as PriceTier[];
}

export function createProduct(input: CreateProductInput): Product {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO products
        (category_id, slug, name, description, unit_label, package_size, stock, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.categoryId,
      input.slug,
      input.name,
      input.description ?? null,
      input.unitLabel ?? "caja",
      input.packageSize ?? null,
      input.stock ?? 0,
      input.active === false ? 0 : 1,
      now,
      now,
    );
  return findProductById(Number(result.lastInsertRowid))!;
}

export function updateProduct(id: number, input: UpdateProductInput): Product | undefined {
  const entries = Object.entries(input).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findProductById(id);
  const sets = entries.map(([key]) => `${PRODUCT_COLUMN_MAP[key as keyof UpdateProductInput]} = ?`);
  sets.push("updated_at = ?");
  const values = entries.map(([, v]) => (typeof v === "boolean" ? (v ? 1 : 0) : v));
  getDb()
    .prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values, new Date().toISOString(), id);
  return findProductById(id);
}

/**
 * Reemplaza las escalas de precio de un producto en una transacción.
 * Las escalas llegan como pares {minQty, priceCents}; SQLite valida los
 * mínimos positivos y la unicidad de min_qty.
 */
export function replacePriceTiers(productId: number, tiers: TierInput[]): void {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare("DELETE FROM price_tiers WHERE product_id = ?").run(productId);
    const insert = db.prepare(
      `INSERT INTO price_tiers (product_id, min_qty, price_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const now = new Date().toISOString();
    for (const tier of tiers) {
      insert.run(productId, tier.minQty, tier.priceCents, now, now);
    }
  });
}

export function deleteProduct(id: number): boolean {
  // order_items referencia product_id sin CASCADE: si el producto tiene
  // pedidos asociados, la FK impide el borrado (integridad histórica).
  return getDb().prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}

/** Agrupa las escalas de precio por producto y devuelve productos con tiers. */
function attachTiers(products: Product[]): ProductWithTiers[] {
  if (products.length === 0) return [];
  const db = getDb();
  const ids = products.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(", ");
  const tiers = db
    .prepare(`SELECT * FROM price_tiers WHERE product_id IN (${placeholders}) ORDER BY min_qty`)
    .all(...ids) as unknown as PriceTier[];
  const byProduct = new Map<number, PriceTier[]>();
  for (const tier of tiers) {
    const list = byProduct.get(tier.product_id) ?? [];
    list.push(tier);
    byProduct.set(tier.product_id, list);
  }
  return products.map((product) => ({ ...product, tiers: byProduct.get(product.id) ?? [] }));
}
