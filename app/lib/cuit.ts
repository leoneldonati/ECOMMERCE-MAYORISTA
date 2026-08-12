// Formato de CUIT para mostrar (XX-XXXXXXXX-X). Compartido (cliente+servidor):
// la validación con dígito verificador queda en cuit.server.ts, solo servidor.

export function formatCuit(cuit: string): string {
  return cuit.length === 11 ? `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}` : cuit;
}
