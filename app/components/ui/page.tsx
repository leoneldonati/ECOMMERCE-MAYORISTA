import type { ReactNode } from "react";

// Contenedor de página: centra y acota el ancho según la densidad del contenido
// (auth/form 2xl, detalle 3xl, listados y admin 6xl). El espaciado vertical se
// elige por `pad` para no pisar py-10 con py-16 en el mismo className.

const PAGE_SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
} as const;

const PAGE_PADS = {
  default: "py-10",
  comfortable: "py-16",
} as const;

export function Page({
  size = "lg",
  pad = "default",
  className,
  children,
}: {
  size?: keyof typeof PAGE_SIZES;
  pad?: keyof typeof PAGE_PADS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full px-4 ${PAGE_PADS[pad]} ${PAGE_SIZES[size]} ${className ?? ""}`}>
      {children}
    </div>
  );
}
