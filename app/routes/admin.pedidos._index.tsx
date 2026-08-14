import { Link } from "react-router";
import type { Route } from "./+types/admin.pedidos._index";

import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { TableShell } from "~/components/ui/table";
import { TextLink } from "~/components/ui/text-link";
import { listOrdersWithUser } from "~/db/repos/orders.server";
import type { OrderStatus } from "~/db/types";
import { formatDateTime } from "~/lib/dates";
import { formatARS } from "~/lib/money";
import { ORDER_STATUS_BADGES } from "~/lib/order-ui";

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "paid", label: "Pagados" },
  { key: "shipped", label: "Enviados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const requested = new URL(request.url).searchParams.get("estado") as OrderStatus | "all" | null;
  const estado = requested ?? "pending";

  const all = listOrdersWithUser();
  const counts = new Map<OrderStatus, number>();
  for (const status of Object.keys(ORDER_STATUS_BADGES) as OrderStatus[]) {
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
        <EmptyState description={`No hay pedidos ${estado === "all" ? "" : "en ese estado"}.`} />
      ) : (
        <TableShell headers={["Pedido", "Cliente", "Fecha", "Total", "Estado"]}>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-stone-100">
              <td className="px-4 py-3">
                <TextLink to={`/admin/pedidos/${order.id}`}>#{order.id}</TextLink>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{order.name}</p>
                <p className="text-stone-500">{order.email}</p>
              </td>
              <td className="px-4 py-3 text-stone-600">{formatDateTime(order.created_at)}</td>
              <td className="px-4 py-3 font-semibold">{formatARS(order.total_cents)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={ORDER_STATUS_BADGES[order.status].tone}>
                    {ORDER_STATUS_BADGES[order.status].label}
                  </Badge>
                  {order.payment_notified_at ? (
                    <span className="text-xs font-medium text-emerald-700">Pago declarado</span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
