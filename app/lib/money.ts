// Formateo de dinero compartido entre cliente y servidor.
// El dinero se maneja siempre en CENTAVOS (integer) y se formatea para ARS.

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formatea centavos como moneda ARS, ej: 1000000 → "$ 10.000". */
export function formatARS(cents: number): string {
  return arsFormatter.format(cents / 100);
}

/**
 * Convierte un string de pesos ingresado por el admin a centavos enteros.
 * Acepta formato argentino ("1.200,50") o punto decimal ("1200.50"). Devuelve
 * null si no es un número válido.
 */
export function pesosToCents(value: string): number | null {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

/** Prepara centavos para un input de precios en pesos (ej: 120050 → "1.200,50"). */
export function centsToPesosInput(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
