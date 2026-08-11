import { data, Link } from "react-router";
import type { Route } from "./+types/pedidos.$id";

import { findOrderWithItems } from "~/db/repos/orders.server";
import type { OrderStatus } from "~/db/types";
import { getContextUser, requireApproved } from "~/lib/middleware.server";
import { formatARS } from "~/lib/money";
import { PAYMENT_INFO } from "~/lib/orders";

export const middleware: Route.MiddlewareFunction[] = [requireApproved];

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  const orderId = Number(params.id);
  if (!Number.isInteger(orderId)) throw data(null, { status: 404 });

  const order = findOrderWithItems(orderId);
  // Un usuario solo ve sus propios pedidos; los ajenos son 404 para no filtrar datos.
  if (order === undefined || order.user_id !== user.id) {
    throw data(null, { status: 404 });
  }
  return { order };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { order } = loaderData;
  return [{ title: `Pedido #${order.id} — MayoristaAR` }];
}

const statusLabels: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: "Pendiente de pago", classes: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmado", classes: "bg-blue-100 text-blue-800" },
  paid: { label: "Pagado", classes: "bg-emerald-100 text-emerald-800" },
  shipped: { label: "En camino", classes: "bg-violet-100 text-violet-800" },
  cancelled: { label: "Cancelado", classes: "bg-red-100 text-red-800" },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetail({ loaderData }: Route.ComponentProps) {
  const { order } = loaderData;
  const status = statusLabels[order.status];

  return (
    <>
      <nav className="mb-4 text-sm text-stone-500">
        <Link to="/pedidos" className="transition-colors hover:text-amber-700">
          Mis pedidos
        </Link>
      </nav>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pedido #{order.id}</h1>
        <span className={`rounded px-2.5 py-1 text-sm font-medium ${status.classes}`}>{status.label}</span>
      </div>

      <p className="mb-6 text-sm text-stone-500">{formatDateTime(order.created_at)}</p>

      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-sm text-stone-500">
                {item.package_size ? `${item.package_size} · ` : ""}
                {item.quantity} x {formatARS(item.unit_price_cents)} = {formatARS(item.subtotal_cents)}
              </p>
            </div>
            <span className="font-medium">{formatARS(item.subtotal_cents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
        <span className="text-stone-600">Total</span>
        <span className="text-xl font-bold">{formatARS(order.total_cents)}</span>
      </div>

      {order.status === "pending" ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 className="mb-2 text-base font-semibold">Datos para el pago</h2>
          <p className="mb-3 text-amber-800">
            Transferí o depositá {formatARS(order.total_cents)} a la siguiente cuenta y avisanos para confirmar el
            pedido.
          </p>
          <dl className="grid gap-1 text-stone-700">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Titular</dt>
              <dd>{PAYMENT_INFO.accountName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">CUIT</dt>
              <dd>{PAYMENT_INFO.cuit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Banco</dt>
              <dd>{PAYMENT_INFO.bank}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">CBU</dt>
              <dd className="font-mono">{PAYMENT_INFO.cbu}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Alias</dt>
              <dd>{PAYMENT_INFO.alias}</dd>
            </div>
          </dl>
          <p className="mt-3 text-amber-800">
            Una vez acreditado el pago, el pedido pasará a estado <strong>pagado</strong>.
          </p>
        </div>
      ) : null}
    </>
  );
}