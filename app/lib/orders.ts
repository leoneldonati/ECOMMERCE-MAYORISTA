// Reglas de la orden de compra (puras, compartidas cliente/servidor, sin DB).

/** Datos de la cuenta donde el cliente deposita/transfiere. Placeholder configurable. */
export const PAYMENT_INFO = {
  accountName: "Impreso Online",
  cuit: "30-12345678-9",
  bank: "Banco Nacional",
  cbu: "0110000000000000000000",
  alias: "IMPRESO.ONLINE",
} as const;

/** Subtotal en centavos de una línea (precio único por unidad × cantidad). */
export function lineSubtotal(priceCents: number, quantity: number): number {
  return priceCents * quantity;
}

/** Total del pedido en centavos sumando los subtotales de las líneas. */
export function computeCartTotal(lines: { quantity: number; priceCents: number }[]): number {
  return lines.reduce((sum, line) => sum + lineSubtotal(line.priceCents, line.quantity), 0);
}
