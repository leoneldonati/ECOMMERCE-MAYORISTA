import type { ReactNode } from "react";

// Badge semántico para estados (pedidos, cuenta, rol). Cada tono cumple
// contraste AA sobre blanco (texto en 800/bg en 100 de la misma escala).

export type BadgeTone = "neutral" | "brand" | "success" | "danger" | "warning" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  brand: "bg-brand-100 text-brand-800",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className ?? ""}`}>
      {children}
    </span>
  );
}