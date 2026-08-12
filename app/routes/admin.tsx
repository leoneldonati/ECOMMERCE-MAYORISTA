import { NavLink, Outlet } from "react-router";
import type { Route } from "./+types/admin";

import { requireAdmin } from "~/lib/middleware.server";

// Shell del panel de administración. El middleware de la ruta padre protege
// también a todas las secciones hijas (clientes, pedidos, productos).

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

const TABS = [
  { to: "/admin", end: true, label: "Resumen" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/productos", label: "Productos" },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-brand-700 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
  }`;

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Panel de administración</h1>
      <nav
        aria-label="Secciones del panel"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-stone-200 pb-3"
      >
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}