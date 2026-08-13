import type { Order } from "~/db/types";
import { orderCreatedMessage, paymentReceivedMessage } from "./notify-messages";

// Envío de notificaciones al admin por el Bot API de Telegram. Sin TOKEN o
// CHAT_ID la notificación es no-op (dev/CI no deberían mandar mensajes).
// El token viaja en la URL del request, por eso los errores se loguean sin la
// URL completa: nunca exponer el token en los logs.

const SEND_TIMEOUT_MS = 5000;

function getTelegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

/** Dominio público del sitio (para links clickeables en el mensaje). */
export function getAppUrl(): string {
  return (process.env.APP_URL ?? "").trim();
}

/**
 * Envía `text` (parse_mode=HTML) al chat configurado. Con timeout acotado para
 * que un Telegram lento/caído nunca bloquee la action que dispara la notificación.
 */
export async function sendTelegram(text: string): Promise<void> {
  const config = getTelegramConfig();
  if (!config) return;
  const url = `https://api.telegram.org/bot${config.token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 500);
      console.error(`[notify] Telegram respondió ${response.status}: ${body}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[notify] No se pudo enviar la notificación: ${detail}`);
  }
}

/** Notificación de pedido nuevo al admin. */
export async function notifyOrderCreated(
  order: Pick<Order, "id" | "total_cents" | "created_at">,
  clientName: string,
  itemsCount: number,
): Promise<void> {
  await sendTelegram(orderCreatedMessage(order, clientName, itemsCount, getAppUrl()));
}

/** Notificación de aviso de pago del cliente al admin. */
export async function notifyPaymentReceived(
  order: Pick<Order, "id" | "total_cents">,
  aviso: { reference: string; message?: string },
): Promise<void> {
  await sendTelegram(paymentReceivedMessage(order, aviso, getAppUrl()));
}
