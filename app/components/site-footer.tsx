import { Link } from "react-router";

// Pie de página global con identidad, tagline, enlaces principales y un
// contacto placeholder (no hay backend de contacto todavía).

const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:justify-between">
        <div>
          <p className="text-lg font-bold tracking-tight">
            Impreso<span className="text-brand-700">Online</span>
          </p>
          <p className="mt-1 max-w-xs text-sm text-stone-500">
            Productos impresos en 3D, en stock o bajo pedido.
          </p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-2 text-sm">
          <Link to="/productos" className="text-stone-600 transition-colors hover:text-stone-900">
            Catálogo
          </Link>
          <Link to="/registro" className="text-stone-600 transition-colors hover:text-stone-900">
            Crear cuenta
          </Link>
          <Link to="/mi-cuenta" className="text-stone-600 transition-colors hover:text-stone-900">
            Mi cuenta
          </Link>
        </nav>
        <div className="text-sm">
          <p className="font-medium text-stone-700">Contacto</p>
          <p className="mt-1 text-stone-500">+54 11 5555 0000</p>
          <p className="text-stone-500">ventas@impresoonline.com.ar</p>
        </div>
      </div>
      <div className="border-t border-stone-100">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-stone-500">
          © {year} Impreso Online. Productos impresos en 3D, venta por unidad.
        </p>
      </div>
    </footer>
  );
}
