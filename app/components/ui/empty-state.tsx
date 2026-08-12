import type { ReactNode } from "react";

// Estado vacío estándar (listados y carrito): bloque centrado con mensaje y,
// opcionalmente, un CTA (TextLink/ButtonLink).

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-stone-200 bg-white px-4 py-10 text-center text-stone-600 ${className ?? ""}`}
    >
      {title ? <p className="mb-2 font-medium text-stone-900">{title}</p> : null}
      {description ? <p className="mb-4">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
