import type { Order } from "~/db/types";
import { formatDateTime } from "./dates";
import { formatARS } from "./money";

// Construye los mensajes de notificación al admin (pedido nuevo y aviso de
// pago). Módulo puro (sin red ni env): el envío vive en notify.server.ts.
// Con `parse_mode=HTML` el contenido del usuario (razón social, referencia,
// mensaje) debe escaparse para no romper ni inyectar markup en el mensaje.

/** Escapa texto del usuario para parse_mode=HTML de Telegram. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Link absoluto al panel del pedido; sin APP_URL se omite para no mandar un enlace muerto. */
function adminLink(orderId: number, appUrl: string): string {
  const base = appUrl.replace(/\/+$/, "");
  if (!base) return "";
  return `\n<a href="${escapeHtml(base)}/admin/pedidos/${orderId}">Ver pedido</a>`;
}

/** Notificación de pedido nuevo: #id, cliente, total y cantidad de ítems. */
export function orderCreatedMessage(
  order: Pick<Order, "id" | "total_cents" | "created_at">,
  clientName: string,
  itemsCount: number,
  appUrl: string,
): string {
  const items = `${itemsCount} ${itemsCount === 1 ? "ítem" : "ítems"}`;
  return [
    `🛒 <b>Pedido #${order.id}</b>`,
    `Cliente: ${escapeHtml(clientName)}`,
    `Total: ${formatARS(order.total_cents)} · ${items} · ${formatDateTime(order.created_at)}`,
    adminLink(order.id, appUrl),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Notificación de aviso de pago: referencia del comprobante y mensaje del cliente. */
export function paymentReceivedMessage(
  order: Pick<Order, "id" | "total_cents">,
  aviso: { reference: string; message?: string },
  appUrl: string,
): string {
  const lines = [
    `💸 <b>Aviso de pago</b> · Pedido #${order.id}`,
    `Total: ${formatARS(order.total_cents)}`,
    `Referencia: ${escapeHtml(aviso.reference)}`,
  ];
  if (aviso.message) lines.push(`Mensaje: ${escapeHtml(aviso.message)}`);
  const link = adminLink(order.id, appUrl);
  if (link) lines.push(link.trim());
  return lines.join("\n");
}
