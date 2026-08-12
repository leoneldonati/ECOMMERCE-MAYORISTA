import type { BadgeTone } from "~/components/ui/badge";
import type { OrderStatus } from "~/db/types";

// Etiquetas y tonos de estado de pedido (cliente y admin) y mensajes flash de
// las transiciones del panel: una sola fuente para listados, detalle y admin.

export const ORDER_STATUS_BADGES: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendiente", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "info" },
  paid: { label: "Pagado", tone: "success" },
  shipped: { label: "Enviado", tone: "info" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

export type TransitionStatus = Exclude<OrderStatus, "pending">;

// Mensaje flash de cada transición unitaria que ejecuta el admin.
export const ORDER_TRANSITION_FLASH: Record<TransitionStatus, string> = {
  confirmed: "Pedido confirmado y stock descontado.",
  paid: "Pedido marcado como pagado.",
  shipped: "Pedido marcado como enviado.",
  cancelled: "Pedido cancelado.",
};
