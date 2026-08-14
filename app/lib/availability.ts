import type { Availability } from "~/db/types";

// Etiqueta legible del estado de disponibilidad (compartido cliente/servidor).

export function availabilityLabel(
  availability: Availability,
  leadTimeDays: number | null = null,
): string {
  if (availability === "made_to_order") {
    return leadTimeDays ? `Bajo pedido · ${leadTimeDays} días` : "Bajo pedido";
  }
  if (availability === "in_stock") return "En stock";
  return "Agotado";
}
