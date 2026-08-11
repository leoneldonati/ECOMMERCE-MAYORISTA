import type { PriceTier } from "~/db/types";

// Lógica pura de escalas de precio (compartida cliente/servidor, sin acceso a DB).
// Regla: la escala aplicable es la de mayor min_qty menor o igual a la cantidad.

/** La forma mínima que necesita un tier para calcular escalas (compatible con PriceTier). */
export interface TierLike {
  min_qty: number;
  price_cents: number | null;
}

/**
 * Devuelve la escala vigente para una cantidad dada, o undefined si ninguna
 * aplica (la cantidad no alcanza el mínimo de la primera escala).
 * Las escalas deben venir ordenadas por min_qty.
 */
export function effectiveTier<T extends TierLike>(tiers: T[], quantity: number): T | undefined {
  let best: T | undefined;
  for (const tier of tiers) {
    if (quantity >= tier.min_qty && (best === undefined || tier.min_qty > best.min_qty)) {
      best = tier;
    }
  }
  return best;
}

/** Subtotal en centavos para una línea, o null si no hay escala aplicable. */
export function lineSubtotalCents(tiers: TierLike[], quantity: number): number | null {
  const tier = effectiveTier(tiers, quantity);
  return tier && tier.price_cents !== null ? tier.price_cents * quantity : null;
}