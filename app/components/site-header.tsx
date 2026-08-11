import { Form, Link } from "react-router";
import type { PublicUser } from "~/db/types";
import { CsrfToken } from "./csrf-token";

export function SiteHeader({ user }: { user: PublicUser | null }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-stone-900">
          Mayorista<span className="text-amber-600">AR</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/productos" className="text-stone-600 hover:text-stone-900">
            Productos
          </Link>
          {user ? (
            <>
              <Link to="/mi-cuenta" className="text-stone-600 hover:text-stone-900">
                {user.business_name}
              </Link>
              {user.role === "admin" ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Admin
                </span>
              ) : null}
              <Form method="post" action="/logout">
                <CsrfToken />
                <button
                  type="submit"
                  className="text-stone-600 transition-colors hover:text-stone-900"
                >
                  Salir
                </button>
              </Form>
            </>
          ) : (
            <>
              <Link to="/login" className="text-stone-600 hover:text-stone-900">
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-amber-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}