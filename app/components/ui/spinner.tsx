import { Loader2 } from "lucide-react";

// Spinner para estados de carga. Gira con CSS; prefers-reduced-motion lo pausa
// (ver app.css). `aria-hidden`: el texto del botón lo acompaña.
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}
