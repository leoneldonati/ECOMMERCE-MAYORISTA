// Tipos de las entidades del modelo de datos (espejo del schema de migrations/).
// Módulo de SOLO tipos (sin runtime): importar siempre con `import type`.

export type Role = "admin" | "customer";
export type UserStatus = "pending" | "approved" | "rejected";
export type CustomerType = "revendedor" | "almacen" | "distribuidor" | "otro";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  status: UserStatus;
  /** Razón social */
  business_name: string;
  /** CUIT de 11 dígitos, sin separadores */
  cuit: string;
  contact_name: string | null;
  phone: string | null;
  province: string | null;
  address: string | null;
  customer_type: CustomerType | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
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
  /** Unidad de venta mayorista: caja, bulto, pack, kilo... */
  unit_label: string;
  /** Presentación, ej: "24 x 1kg" */
  package_size: string | null;
  /** Stock en unidades de venta (cajas) */
  stock: number;
  active: number;
  /** Joins de catálogo (no viven en la tabla) */
  category_name?: string;
  category_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceTier {
  id: number;
  product_id: number;
  /** Cantidad mínima de unidades de venta para aplicar esta escala */
  min_qty: number;
  /** Precio por unidad de venta en centavos ARS */
  price_cents: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithTiers extends Product {
  /** Escalas ordenadas por min_qty */
  tiers: PriceTier[];
}

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
  unit_label: string;
  package_size: string | null;
  quantity: number;
  /** Precio por unidad capturado al crear la orden (incluye la escala aplicada) */
  unit_price_cents: number;
  subtotal_cents: number;
}
