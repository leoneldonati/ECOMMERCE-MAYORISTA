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