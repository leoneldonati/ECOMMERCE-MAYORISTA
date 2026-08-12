import { Outlet } from "react-router";
import type { Route } from "./+types/admin.pedidos";

import { requireAdmin } from "~/lib/middleware.server";

// Layout de /admin/pedidos: el listado vive en admin.pedidos._index y el
// detalle en admin.pedidos.$id (mismo patrón que /pedidos del cliente).

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export default function AdminPedidosLayout() {
  return <Outlet />;
}