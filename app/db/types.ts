// Tipos de las entidades del modelo de datos (espejo del schema de migrations/).
// Módulo de SOLO tipos (sin runtime): importar siempre con `import type`.

export type Role = "admin" | "customer";
export type UserStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  status: UserStatus;
  /** Nombre del cliente */
  name: string;
  phone: string | null;
  province: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/** Usuario sin el hash de contraseña (seguro para exponer) */
export type PublicUser = Omit<User, "password_hash">;

export interface Session {
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  /** 1 activa, 0 inactiva (presente en catálogo pero no listada) */
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  description: string | null;
  /** Precio único por unidad de venta en centavos ARS */
  price_cents: number;
  /** Imagen del producto (URL externa) */
  image_url: string | null;
  /** Stock en unidades de venta (solo si no es bajo pedido) */
  stock: number;
  /** Días de producción cuando `made_to_order = 1` */
  lead_time_days: number | null;
  /** 1 = se imprime bajo pedido (sin tope de stock); 0 = en stock */
  made_to_order: number;
  active: number;
  /** Joins de catálogo (no viven en la tabla) */
  category_name?: string;
  category_slug?: string;
  created_at: string;
  updated_at: string;
}

/** Estado de disponibilidad de un producto para la UI. */
export type Availability = "in_stock" | "made_to_order" | "out_of_stock";

export type OrderStatus = "pending" | "confirmed" | "paid" | "shipped" | "cancelled";

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  notes: string | null;
  /** Total en centavos ARS (suma de subtotales de order_items al crear) */
  total_cents: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  /** Referencia del comprobante que declaró el cliente al avisar el pago */
  payment_reference: string | null;
  /** Mensaje opcional del cliente junto al aviso de pago */
  payment_message: string | null;
  /** Fecha del aviso de pago (null = el cliente todavía no avisó) */
  payment_notified_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  /** Snapshot de catálogo: la orden no cambia aunque el producto lo haga */
  product_name: string;
  image_url: string | null;
  quantity: number;
  /** Precio por unidad capturado al crear la orden */
  unit_price_cents: number;
  subtotal_cents: number;
}
