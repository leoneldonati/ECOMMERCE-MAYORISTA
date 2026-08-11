import { Outlet } from "react-router";
import type { Route } from "./+types/pedidos";

export default function PedidosLayout() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Outlet />
    </div>
  );
}