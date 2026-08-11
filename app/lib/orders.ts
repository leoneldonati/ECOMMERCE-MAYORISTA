import { effectiveTier, lineSubtotalCents, type TierLike } from "./pricing";

// Reglas de la orden de compra (puras, compartidas cliente/servidor, sin DB).

/** Mínimo por pedido en centavos ARS: $ 10.000. */
export const MIN_ORDER_CENTS = 1_000_000;

/** Datos de la cuenta donde el cliente deposita/transfiere. Placeholder configurable. */
export const PAYMENT_INFO = {
  accountName: "MayoristaAR S.A.",
  cuit: "30-12345678-9",
  bank: "Banco Nacional",
  cbu: "0110000000000000000000",
  alias: "MAYORISTA.AR",
} as const;

/** Precio unitario vigente para una cantidad, o null si ninguna escala aplica. */
export function lineUnitPrice(tiers: TierLike[], quantity: number): number | null {
  const tier = effectiveTier(tiers, quantity);
  return tier && tier.price_cents !== null ? tier.price_cents : null;
}

/** Menor cantidad para arrancar la primera escala (mínimo por línea), o null. */
export function lineMinQty(tiers: TierLike[]): number | null {
  const min = Math.min(...tiers.map((tier) => tier.min_qty));
  return Number.isFinite(min) ? min : null;
}

/** Subtotal en centavos de una línea, o null si no hay escala aplicable. */
export function lineSubtotal(tiers: TierLike[], quantity: number): number | null {
  return lineSubtotalCents(tiers, quantity);
}

/** Total del pedido en centavos sumando los subtotales válidos. */
export function computeCartTotal(lines: { quantity: number; tiers: TierLike[] }[]): number {
  return lines.reduce((sum, line) => {
    const subtotal = lineSubtotal(line.tiers, line.quantity);
    return subtotal === null ? sum : sum + subtotal;
  }, 0);
}

/** Centavos que faltan para llegar al pedido mínimo (0 si ya se alcanza). */
export function shortfallToMin(totalCents: number): number {
  return Math.max(0, MIN_ORDER_CENTS - totalCents);
}