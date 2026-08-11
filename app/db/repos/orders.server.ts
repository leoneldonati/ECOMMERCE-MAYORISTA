import { getDb } from "../client.server";
import { withTransaction } from "../transaction.server";
import type { Order, OrderItem } from "../types";
import { lineMinQty, lineUnitPrice, MIN_ORDER_CENTS } from "../../lib/orders";
import { formatARS } from "../../lib/money";
import { clearCart, listCartWithProducts } from "./cart.server";

// Pedidos del cliente. Al crear la orden se congelan snapshots (nombre, unidad,
// presentación, precio) en order_items: el pedido no cambia aunque el catálogo sí.

export type OrderErrorCode =
  | "empty_cart"
  | "line_below_min"
  | "insufficient_stock"
  | "below_min_order";

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * Crea la orden (status `pending`) re-leyendo el carrito dentro de la transacción:
 * valida escala aplicable y stock por línea, suma el total y exige el mínimo.
 * No descuenta stock: el pedido queda pendiente y el admin lo gestiona al confirmar.
 * Devuelve la orden creada.
 */
export function createOrderFromCart(userId: number, notes?: string): OrderWithItems {
  const db = getDb();
  let orderId = 0;

  withTransaction(db, () => {
    const lines = listCartWithProducts(userId);
    if (lines.length === 0) {
      throw new OrderError("empty_cart", "El carrito está vacío.");
    }

    // Primero se validan y calculan todas las líneas (sin escribir), para no
    // dejar lineas huérfanas si alguna falla.
    interface ItemInput {
      productId: number;
      name: string;
      unitLabel: string;
      packageSize: string | null;
      quantity: number;
      unitPriceCents: number;
      subtotalCents: number;
    }
    const items: ItemInput[] = [];
    let total = 0;

    for (const line of lines) {
      const { product, quantity } = line;
      const unitPrice = lineUnitPrice(product.tiers, quantity);
      if (unitPrice === null) {
        const min = lineMinQty(product.tiers);
        throw new OrderError(
          "line_below_min",
          `"${product.name}" requiere un mínimo de ${min ?? "?"} unidades por línea.`
        );
      }
      if (quantity > product.stock) {
        throw new OrderError(
          "insufficient_stock",
          `Stock insuficiente de "${product.name}" (disponible: ${product.stock}).`
        );
      }

      const subtotal = unitPrice * quantity;
      total += subtotal;
      items.push({
        productId: product.id,
        name: product.name,
        unitLabel: product.unit_label,
        packageSize: product.package_size,
        quantity,
        unitPriceCents: unitPrice,
        subtotalCents: subtotal,
      });
    }

    if (total < MIN_ORDER_CENTS) {
      throw new OrderError(
        "below_min_order",
        `El pedido mínimo es ${formatARS(MIN_ORDER_CENTS)}.`
      );
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO orders (user_id, status, notes, total_cents, created_at, updated_at)
         VALUES (?, 'pending', ?, ?, ?, ?)`
      )
      .run(userId, notes ?? null, total, now, now);
    orderId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items
        (order_id, product_id, product_name, unit_label, package_size, quantity,
         unit_price_cents, subtotal_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of items) {
      insertItem.run(
        orderId,
        item.productId,
        item.name,
        item.unitLabel,
        item.packageSize,
        item.quantity,
        item.unitPriceCents,
        item.subtotalCents
      );
    }

    clearCart(userId);
  });

  return findOrderWithItems(orderId)!;
}

export function listOrdersByUser(userId: number): Order[] {
  return getDb()
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as Order[];
}

export function findOrderWithItems(orderId: number): OrderWithItems | undefined {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | Order
    | undefined;
  if (!order) return undefined;
  const items = db
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
    .all(orderId) as unknown as OrderItem[];
  return { ...order, items };
}