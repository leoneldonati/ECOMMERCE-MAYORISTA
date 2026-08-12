import { getDb } from "../client.server";
import { withTransaction } from "../transaction.server";
import type { Order, OrderItem, OrderStatus } from "../types";
import { lineMinQty, lineUnitPrice, MIN_ORDER_CENTS } from "../../lib/orders";
import { formatARS } from "../../lib/money";
import { clearCart, listCartWithProducts } from "./cart.server";

// Pedidos del cliente. Al crear la orden se congelan snapshots (nombre, unidad,
// presentación, precio) en order_items: el pedido no cambia aunque el catálogo sí.

export type OrderErrorCode =
  | "empty_cart"
  | "line_below_min"
  | "insufficient_stock"
  | "below_min_order"
  | "invalid_transition"
  | "not_found"
  | "not_pending";

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

/**
 * Registra el aviso de pago del cliente (transferencia/depósito) con la
 * referencia del comprobante y un mensaje opcional. Solo se permite mientras la
 * orden está `pending`; si el cliente se equivocó puede volver a avisar y el
 * registro anterior se sobrescribe.
 */
export function notifyPayment(orderId: number, input: { reference: string; message?: string }): void {
  const db = getDb();
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId) as
    | { status: OrderStatus }
    | undefined;
  if (!order) throw new OrderError("not_found", "El pedido no existe.");
  if (order.status !== "pending") {
    throw new OrderError(
      "not_pending",
      "El pedido ya fue procesado y no admite declarar un pago.",
    );
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET payment_reference = ?, payment_message = ?, payment_notified_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(input.reference, input.message ?? null, now, now, orderId);
}

export interface OrderWithUser extends Order {
  business_name: string;
  email: string;
}

/** Pedidos con datos del cliente (razón social y email). Filtra por estado si se pasa. */
export function listOrdersWithUser(status?: OrderStatus): OrderWithUser[] {
  const db = getDb();
  const sql = status
    ? `SELECT o.*, u.business_name, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.status = ? ORDER BY o.created_at DESC`
    : `SELECT o.*, u.business_name, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`;
  return db.prepare(sql).all(...(status ? [status] : [])) as unknown as OrderWithUser[];
}

/** Transiciones permitidas entre estados; avanza o cancela, nunca retrocede. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped"],
  shipped: [],
  cancelled: [],
};

/** Columna de timestamp que registra cada estado destino (para actualizarla). */
const STATUS_TIMESTAMP: Record<OrderStatus, "confirmed_at" | "paid_at" | "shipped_at" | "cancelled_at" | null> = {
  pending: null,
  confirmed: "confirmed_at",
  paid: "paid_at",
  shipped: "shipped_at",
  cancelled: "cancelled_at",
};

/**
 * Transiciona el estado de un pedido. Al confirmar se valida y descuenta el
 * stock de cada ítem dentro de la misma transacción (el confirmar es el momento
 * en que el admin se compromete con la mercadería).
 */
export function transitionOrderStatus(orderId: number, target: OrderStatus): OrderWithItems {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | Order
    | undefined;
  if (!order) throw new OrderError("not_found", "El pedido no existe.");

  if (!ALLOWED_TRANSITIONS[order.status].includes(target)) {
    throw new OrderError(
      "invalid_transition",
      `No se puede pasar el pedido de "${order.status}" a "${target}".`,
    );
  }

  withTransaction(db, () => {
    if (target === "confirmed") {
      const items = db
        .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
        .all(orderId) as unknown as OrderItem[];
      const updateStock = db.prepare(
        "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?",
      );
      const now = new Date().toISOString();
      for (const item of items) {
        const product = db
          .prepare("SELECT stock FROM products WHERE id = ?")
          .get(item.product_id) as { stock: number } | undefined;
        if (!product) {
          throw new OrderError("not_found", `El producto "${item.product_name}" ya no existe.`);
        }
        if (item.quantity > product.stock) {
          throw new OrderError(
            "insufficient_stock",
            `Stock insuficiente de "${item.product_name}" (disponible: ${product.stock}).`,
          );
        }
        updateStock.run(item.quantity, now, item.product_id);
      }
    }

    const column = STATUS_TIMESTAMP[target];
    const now = new Date().toISOString();
    if (column) {
      db.prepare(`UPDATE orders SET status = ?, updated_at = ?, ${column} = ? WHERE id = ?`).run(
        target,
        now,
        now,
        orderId,
      );
    } else {
      db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(target, now, orderId);
    }
  });

  return findOrderWithItems(orderId)!;
}