import { Link } from "react-router";
import type { ComponentProps } from "react";

// Link de marca para ir entre secciones dentro de texto: color de marca con
// subrayado al hover.

export function TextLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link className={`font-medium text-brand-700 hover:underline ${className ?? ""}`} {...props}>
      {children}
    </Link>
  );
}
