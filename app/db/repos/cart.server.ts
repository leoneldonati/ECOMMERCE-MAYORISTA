import { getDb } from "../client.server";
import type { Product } from "../types";

// Carrito persistido por usuario (cart_items). El server es la fuente de verdad:
// los precios/stock se revalidan al crear la orden, no al agregar.

export interface CartLine {
  product_id: number;
  quantity: number;
  product: Product;
}

type CartProductRow = Product & { product_id: number; quantity: number };

/** Líneas del carrito con los productos activos. */
export function listCartWithProducts(userId: number): CartLine[] {
  const rows = getDb()
    .prepare(
      `SELECT c.product_id, c.quantity, p.*
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? AND p.active = 1
       ORDER BY p.name`,
    )
    .all(userId) as unknown as CartProductRow[];
  return rows.map(({ product_id, quantity, ...product }) => ({ product_id, quantity, product }));
}

export function countCartItems(userId: number): number {
  const { count } = getDb()
    .prepare("SELECT COUNT(*) AS count FROM cart_items WHERE user_id = ?")
    .get(userId) as { count: number };
  return count;
}

/**
 * Agrega o reemplaza la cantidad de un producto en el carrito.
 * Lanza si la cantidad es inválida; el producto debe existir y estar activo.
 */
export function upsertItem(userId: number, productId: number, quantity: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError("La cantidad debe ser un entero positivo.");
  }
  const db = getDb();
  const product = db.prepare("SELECT id FROM products WHERE id = ? AND active = 1").get(productId);
  if (!product) {
    throw new Error("El producto no está disponible en el catálogo.");
  }
  db.prepare(
    `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, product_id) DO UPDATE SET
       quantity = excluded.quantity,
       updated_at = excluded.updated_at`,
  ).run(userId, productId, quantity, new Date().toISOString(), new Date().toISOString());
}

export function removeItem(userId: number, productId: number): void {
  getDb()
    .prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?")
    .run(userId, productId);
}

export function clearCart(userId: number): void {
  getDb().prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
}
