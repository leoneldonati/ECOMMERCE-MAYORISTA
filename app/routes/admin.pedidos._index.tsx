import { Link } from "react-router";
import type { Route } from "./+types/admin.pedidos._index";

import { Badge, type BadgeTone } from "~/components/ui/badge";
import { listOrdersWithUser } from "~/db/repos/orders.server";
import type { OrderStatus } from "~/db/types";
import { formatARS } from "~/lib/money";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  paid: "success",
  shipped: "info",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pagado",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "paid", label: "Pagados" },
  { key: "shipped", label: "Enviados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const requested = new URL(request.url).searchParams.get("estado") as OrderStatus | "all" | null;
  const estado = requested ?? "pending";

  const all = listOrdersWithUser();
  const counts = new Map<OrderStatus, number>();
  for (const status of Object.keys(STATUS_LABEL) as OrderStatus[]) {
    counts.set(status, all.filter((order) => order.status === status).length);
  }
  const orders = estado === "all" ? all : all.filter((order) => order.status === estado);

  return { orders, estado, counts: Object.fromEntries(counts) };
}

export default function AdminOrders({ loaderData }: Route.ComponentProps) {
  const { orders, estado, counts } = loaderData;

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-1 text-sm" aria-label="Filtrar pedidos">
        {FILTERS.map((filter) => {
          const count = filter.key === "all" ? undefined : counts[filter.key];
          const active = estado === filter.key;
          return (
            <Link
              key={filter.key}
              to={`/admin/pedidos${filter.key === "all" ? "" : `?estado=${filter.key}`}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                active ? "bg-brand-700 text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {filter.label}
              {count !== undefined ? ` (${count})` : ""}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white px-4 py-10 text-center text-stone-600">
          No hay pedidos {estado === "all" ? "" : "en ese estado"}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">Pedido</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/pedidos/${order.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.business_name}</p>
                    <p className="text-stone-500">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3 font-semibold">{formatARS(order.total_cents)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                      {order.payment_notified_at ? (
                        <span className="text-xs font-medium text-emerald-700">Pago declarado</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}