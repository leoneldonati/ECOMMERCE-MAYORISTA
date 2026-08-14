import type { SQLInputValue } from "node:sqlite";
import { getDb } from "../client.server";
import type { Product } from "../types";

// Repositorio de productos de impresión 3D (precio único, imagen y
// disponibilidad en stock / bajo pedido).

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
  priceCents: number;
  imageUrl?: string;
  stock?: number;
  leadTimeDays?: number | null;
  madeToOrder?: boolean;
  active?: boolean;
}

export interface UpdateProductInput {
  categoryId?: number;
  slug?: string;
  name?: string;
  description?: string | null;
  priceCents?: number;
  imageUrl?: string | null;
  stock?: number;
  leadTimeDays?: number | null;
  madeToOrder?: boolean;
  active?: boolean;
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
  priceCents: "price_cents",
  imageUrl: "image_url",
  stock: "stock",
  leadTimeDays: "lead_time_days",
  madeToOrder: "made_to_order",
  active: "active",
};

export function listProducts(filters: ProductFilters = {}): Product[] {
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
    // Ambos lados normalizados (acentos + mayúsculas) para que "figura" encuentre "Figuras".
    where.push(`(${deaccent("p.name")} LIKE ? OR (${deaccent("p.description")} LIKE ?))`);
    params.push(`%${search}%`, `%${search}%`);
  }
  const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id${whereSql}
       ORDER BY p.name`,
    )
    .all(...params) as unknown as Product[];
}

export function findProductBySlug(slug: string): Product | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ?`,
    )
    .get(slug) as Product | undefined;
}

export function findProductById(id: number): Product | undefined {
  return getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined;
}

export function createProduct(input: CreateProductInput): Product {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO products
        (category_id, slug, name, description, price_cents, image_url, stock,
         lead_time_days, made_to_order, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.categoryId,
      input.slug,
      input.name,
      input.description ?? null,
      input.priceCents,
      input.imageUrl ?? null,
      input.stock ?? 0,
      input.leadTimeDays ?? null,
      input.madeToOrder === true ? 1 : 0,
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

export function deleteProduct(id: number): boolean {
  // order_items referencia product_id sin CASCADE: si el producto tiene
  // pedidos asociados, la FK impide el borrado (integridad histórica).
  return getDb().prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}
