import type { ElementType, ReactNode } from "react";

// Superficie estándar del sitio (borde y fondo de marca). El padding se pasa
// por className porque cada uso lo necesita distinto; el título usa el estilo
// de encabezado de panel (admin.pedidos.$id). `as` permite mantener la
// semántica del contenedor (article en tarjetas de catálogo, por ejemplo).

export function Card({
  as = "div",
  title,
  children,
  className,
}: {
  as?: ElementType;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag className={`rounded-lg border border-stone-200 bg-white ${className ?? ""}`}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </h2>
      ) : null}
      {children}
    </Tag>
  );
}
