import { Form, Link, NavLink, useLocation } from "react-router";
import { useEffect, useState } from "react";
import type { PublicUser } from "~/db/types";
import { CsrfToken } from "./csrf-token";
import { Badge } from "./ui/badge";
import { Button, ButtonLink } from "./ui/button";

// Identidad del header: marca con glifo de impresión 3D (mismo trazo que el
// favicon), NavLink con aria-current automático y menú colapsable en mobile.

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" aria-hidden="true" fill="none">
        <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 11 L21 11" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 8 V6 a2 2 0 0 1 2-2 h4 a2 2 0 0 1 2 2 V8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight">
        Impreso<span className="text-brand-700">Online</span>
      </span>
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? "font-medium text-brand-700" : "text-stone-600 hover:text-stone-900"}`;

export function SiteHeader({ user, cartCount }: { user: PublicUser | null; cartCount: number }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Cerrar el menú después de navegar.
  useEffect(() => setOpen(false), [location.pathname]);

  const canBuy = user !== null && (user.role === "admin" || user.status === "approved");
  const loggedIn = user !== null;

  const menu = (
    <>
      <NavLink to="/productos" className={navLinkClass} end>
        Productos
      </NavLink>
      {canBuy ? (
        <NavLink to="/carrito" className={navLinkClass}>
          Carrito{cartCount > 0 ? ` (${cartCount})` : ""}
        </NavLink>
      ) : null}
      {loggedIn ? (
        <>
          <NavLink to="/mi-cuenta" className={navLinkClass}>
            Mi cuenta
          </NavLink>
          {user.role === "admin" ? (
            <NavLink to="/admin" end className={navLinkClass}>
              Panel
            </NavLink>
          ) : null}
          {user.role === "admin" ? <Badge tone="brand">Admin</Badge> : null}
          <Form method="post" action="/logout">
            <CsrfToken />
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </Form>
        </>
      ) : (
        <>
          <NavLink to="/login" className={navLinkClass}>
            Ingresar
          </NavLink>
          <ButtonLink to="/registro" size="sm">
            Registrarse
          </ButtonLink>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-4 text-sm md:flex">
          {menu}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {canBuy ? (
            <Link
              to="/carrito"
              aria-label={`Carrito de compras, ${cartCount} artículo${cartCount === 1 ? "" : "s"}`}
              className="relative rounded-md p-1.5 text-stone-700 hover:bg-stone-100"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
                <path
                  d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
            className={`rounded-md p-1.5 transition-colors hover:bg-stone-100 ${open ? "bg-stone-100 text-stone-900" : "text-stone-700"}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <path d="M6 6 L18 18" />
                  <path d="M18 6 L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 6 H20" />
                  <path d="M4 12 H20" />
                  <path d="M4 18 H20" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="menu-mobile"
          aria-label="Menú móvil"
          className="flex flex-col gap-3 border-t border-stone-100 bg-white px-4 py-4 text-sm md:hidden"
        >
          {menu}
        </nav>
      ) : null}
    </header>
  );
}
