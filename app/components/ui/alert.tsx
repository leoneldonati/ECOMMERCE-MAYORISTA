import type { ReactNode } from "react";

// Caja de aviso tonal con contraste AA (texto 800/900 sobre fondo 50 de la
// misma escala). El layout interno (títulos, listas) lo arma el llamador.

export type AlertTone = "info" | "success" | "warning" | "danger";
export type AlertSize = "sm" | "md" | "lg";

const TONES: Record<AlertTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800",
};

const SIZES: Record<AlertSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "p-4",
};

export function Alert({
  tone = "info",
  padding = "sm",
  className,
  children,
}: {
  tone?: AlertTone;
  padding?: AlertSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-md border text-sm ${TONES[tone]} ${SIZES[padding]} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
