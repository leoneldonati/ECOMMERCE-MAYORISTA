import { getDb } from "../client.server";
import type { Category } from "../types";

// Repositorio de categorías de catálogo.

export interface CreateCategoryInput {
  slug: string;
  name: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}

export function createCategory(input: CreateCategoryInput): Category {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO categories (slug, name, description, sort_order, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.slug,
      input.name,
      input.description ?? null,
      input.sortOrder ?? 0,
      input.active === false ? 0 : 1,
      now,
      now
    );
  return findCategoryById(Number(result.lastInsertRowid))!;
}

export function listCategories(activeOnly = false): Category[] {
  const sql = activeOnly
    ? "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name"
    : "SELECT * FROM categories ORDER BY sort_order, name";
  return getDb().prepare(sql).all() as unknown as Category[];
}

export function findCategoryById(id: number): Category | undefined {
  return getDb().prepare("SELECT * FROM categories WHERE id = ?").get(id) as
    | Category
    | undefined;
}

export function findCategoryBySlug(slug: string): Category | undefined {
  return getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as
    | Category
    | undefined;
}

export interface CategoryWithCount {
  slug: string;
  name: string;
  sort_order: number;
  product_count: number;
}

/** Categorías activas con su conteo de productos activos (oculta las vacías). */
export function listCategoriesWithActiveCounts(): CategoryWithCount[] {
  return getDb()
    .prepare(
      `SELECT c.slug, c.name, c.sort_order, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
       WHERE c.active = 1
       GROUP BY c.id
       HAVING COUNT(p.id) > 0
       ORDER BY c.sort_order, c.name`
    )
    .all() as unknown as CategoryWithCount[];
}

const COLUMN_MAP: Record<keyof UpdateCategoryInput, string> = {
  slug: "slug",
  name: "name",
  description: "description",
  sortOrder: "sort_order",
  active: "active",
};

export interface UpdateCategoryInput {
  slug?: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export function updateCategory(id: number, input: UpdateCategoryInput): Category | undefined {
  const entries = Object.entries(input).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findCategoryById(id);
  const sets = entries.map(([key]) => `${COLUMN_MAP[key as keyof UpdateCategoryInput]} = ?`);
  sets.push("updated_at = ?");
  const values = entries.map(([, v]) => (typeof v === "boolean" ? (v ? 1 : 0) : v));
  getDb()
    .prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values, new Date().toISOString(), id);
  return findCategoryById(id);
}

/**
 * Elimina una categoría. Lanza si tiene productos asociados para evitar
 * borrar datos del catálogo por accidente.
 */
export function deleteCategory(id: number): boolean {
  const db = getDb();
  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?")
    .get(id) as { count: number };
  if (count > 0) {
    throw new Error("No se puede eliminar: la categoría tiene productos asociados.");
  }
  return db.prepare("DELETE FROM categories WHERE id = ?").run(id).changes > 0;
}