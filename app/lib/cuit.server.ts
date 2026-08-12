// Validación de CUIT/CUIL argentino (11 dígitos) con el dígito verificador
// de AFIP (módulo 11). Se acepta entrada con guiones o espacios.

const PREFIXES_VALIDOS = new Set(["20", "23", "24", "27", "30", "33", "34"]);

// Peso posicional de AFIP para los primeros 10 dígitos.
const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Normaliza un CUIT a 11 dígitos (quita guiones y espacios). */
export function normalizeCuit(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

/**
 * Valida un CUIT/CUIL argentino: formato de 11 dígitos, tipo de persona
 * válido y dígito verificador correcto.
 */
export function isValidCuit(input: string): boolean {
  const cuit = normalizeCuit(input);
  if (!/^\d{11}$/.test(cuit)) return false;
  if (!PREFIXES_VALIDOS.has(cuit.slice(0, 2))) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cuit[i]) * WEIGHTS[i];
  const mod = 11 - (sum % 11);
  if (mod === 11) return cuit[10] === "0";
  if (mod === 10) return false; // cuit inválido por norma de AFIP
  return mod === Number(cuit[10]);
}
