import { Link } from "react-router";
import type { Route } from "./+types/pedidos._index";

import { listOrdersByUser } from "~/db/repos/orders.server";
import { getContextUser, requireApproved } from "~/lib/middleware.server";
import { formatARS } from "~/lib/money";
import type { OrderStatus } from "~/db/types";

export const middleware: Route.MiddlewareFunction[] = [requireApproved];

export async function loader({ context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  return { orders: listOrdersByUser(user.id) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mis pedidos — Despensa Online" }];
}

const statusLabels: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: "Pendiente de pago", classes: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmado", classes: "bg-blue-100 text-blue-800" },
  paid: { label: "Pagado", classes: "bg-emerald-100 text-emerald-800" },
  shipped: { label: "En camino", classes: "bg-violet-100 text-violet-800" },
  cancelled: { label: "Cancelado", classes: "bg-red-100 text-red-800" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderList({ loaderData }: Route.ComponentProps) {
  const { orders } = loaderData;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-10 text-center">
          <p className="mb-4 text-stone-600">Todavía no realizaste pedidos.</p>
          <Link to="/productos" className="font-medium text-brand-700 hover:underline">
            Empezar a comprar
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
          {orders.map((order) => {
            const status = statusLabels[order.status];
            return (
              <li key={order.id}>
                <Link
                  to={`/pedidos/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-stone-50"
                >
                  <div>
                    <p className="font-medium">
                      Pedido #{order.id}
                      {order.notes ? <span className="ml-2 font-normal text-stone-500">· {order.notes}</span> : null}
                    </p>
                    <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{formatARS(order.total_cents)}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.classes}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}