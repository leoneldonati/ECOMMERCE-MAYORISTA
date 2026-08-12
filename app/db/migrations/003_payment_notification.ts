import type { Migration } from "../migrate.server";

// Migración 003: aviso de pago del cliente.
// Cuando el cliente hace la transferencia/depósito declara el pago en la orden:
// guardamos la referencia del comprobante y un mensaje opcional. La orden sigue
// `pending` (el admin verifica la acreditación); `payment_notified_at` NULL
// significa que el cliente todavía no avisó.

export const migration: Migration = {
  id: "003_payment_notification",
  description: "Aviso de pago del cliente en orders",
  up: `
ALTER TABLE orders ADD COLUMN payment_reference TEXT;
ALTER TABLE orders ADD COLUMN payment_message TEXT;
ALTER TABLE orders ADD COLUMN payment_notified_at TEXT;
`,
};