import { Form, Link, NavLink, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Box, Heart, Menu, ShoppingCart, X } from "lucide-react";
import type { PublicUser } from "~/db/types";
import { CsrfToken } from "./csrf-token";
import { Badge } from "./ui/badge";
import { Button, ButtonLink } from "./ui/button";

// Identidad del header: marca con glifo de cubo 3D (mismo trazo que el
// favicon), NavLink con aria-current automático y menú colapsable en mobile.

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Box className="h-6 w-6 text-brand-700" strokeWidth={1.8} aria-hidden="true" />
      <span className="text-lg font-bold tracking-tight">
        Impreso<span className="text-brand-700">Online</span>
      </span>
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? "font-medium text-brand-700" : "text-stone-600 hover:text-stone-900"}`;

export function SiteHeader({
  user,
  cartCount,
  favoriteCount,
}: {
  user: PublicUser | null;
  cartCount: number;
  favoriteCount: number;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Cerrar el menú después de navegar.
  useEffect(() => setOpen(false), [location.pathname]);

  const canBuy = user !== null;
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
      {canBuy ? (
        <NavLink to="/favoritos" className={navLinkClass}>
          Favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
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
              to="/favoritos"
              aria-label={`Favoritos, ${favoriteCount} producto${favoriteCount === 1 ? "" : "s"}`}
              className="relative rounded-md p-1.5 text-stone-700 hover:bg-stone-100"
            >
              <Heart className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              {favoriteCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {favoriteCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {canBuy ? (
            <Link
              to="/carrito"
              aria-label={`Carrito de compras, ${cartCount} artículo${cartCount === 1 ? "" : "s"}`}
              className="relative rounded-md p-1.5 text-stone-700 hover:bg-stone-100"
            >
              <ShoppingCart className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
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
            {open ? (
              <X className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            )}
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
