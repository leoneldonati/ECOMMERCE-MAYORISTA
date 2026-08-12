import type { ReactNode } from "react";

// Error general de formulario (_form). role="alert" lo anuncia a lectores de
// pantalla; cuando no hay mensaje no se renderiza nada.

export function FormError({ children, className }: { children?: ReactNode; className?: string }) {
  if (children == null || children === "") return null;
  return (
    <p
      role="alert"
      className={`rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
