import { getDb } from "../client.server";
import type { Product } from "../types";

// Lista de deseos por usuario (favorites). El id de BD del producto es lo que
// se postea en el toggle, igual que en el carrito.

/** Marca un producto como favorito (ignora si ya estaba). */
export function addFavorite(userId: number, productId: number): void {
  getDb()
    .prepare(
      `INSERT INTO favorites (user_id, product_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, product_id) DO NOTHING`,
    )
    .run(userId, productId, new Date().toISOString());
}

/** Quita un producto de los favoritos. */
export function removeFavorite(userId: number, productId: number): void {
  getDb()
    .prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?")
    .run(userId, productId);
}

/**
 * Alterna el favorito y devuelve el nuevo estado (true = quedó favorito).
 * Valida que el producto exista y esté activo antes de agregar.
 */
export function toggleFavorite(userId: number, productId: number): boolean {
  if (isFavorite(userId, productId)) {
    removeFavorite(userId, productId);
    return false;
  }
  const product = getDb()
    .prepare("SELECT id FROM products WHERE id = ? AND active = 1")
    .get(productId);
  if (!product) throw new Error("El producto no está disponible en el catálogo.");
  addFavorite(userId, productId);
  return true;
}

export function isFavorite(userId: number, productId: number): boolean {
  return (
    getDb()
      .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?")
      .get(userId, productId) !== undefined
  );
}

/** Ids de los productos favoritos del usuario, en orden de marcado. */
export function listFavoriteProductIds(userId: number): number[] {
  const rows = getDb()
    .prepare("SELECT product_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as { product_id: number }[];
  return rows.map((row) => row.product_id);
}

export function countFavorites(userId: number): number {
  const { count } = getDb()
    .prepare("SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?")
    .get(userId) as { count: number };
  return count;
}

/** Productos activos favoritos del usuario (para la página /favoritos). */
export function listFavoriteProducts(userId: number): Product[] {
  return getDb()
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE f.user_id = ? AND p.active = 1
       ORDER BY f.created_at DESC`,
    )
    .all(userId) as unknown as Product[];
}
