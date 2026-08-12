import type { OrderStatus } from "~/db/types";
import type { BadgeTone } from "~/components/ui/badge";

// Etiquetas compartidas de estado de pedido (cliente y servidor): un solo
// lugar para el texto y el tono visual que usan la lista y el detalle.

export const ORDER_STATUS_BADGES: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendiente de pago", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "info" },
  paid: { label: "Pagado", tone: "success" },
  shipped: { label: "En camino", tone: "info" },
  cancelled: { label: "Cancelado", tone: "danger" },
};