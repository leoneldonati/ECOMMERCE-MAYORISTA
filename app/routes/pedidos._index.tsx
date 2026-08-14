import { Link } from "react-router";
import type { Route } from "./+types/pedidos._index";

import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { TextLink } from "~/components/ui/text-link";
import { listOrdersByUser } from "~/db/repos/orders.server";
import { getContextUser, requireUser } from "~/lib/middleware.server";
import { formatDateTime } from "~/lib/dates";
import { formatARS } from "~/lib/money";
import { ORDER_STATUS_BADGES } from "~/lib/order-ui";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export async function loader({ context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  return { orders: listOrdersByUser(user.id) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mis pedidos — Impreso Online" }];
}

export default function OrderList({ loaderData }: Route.ComponentProps) {
  const { orders } = loaderData;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Mis pedidos</h1>

      {orders.length === 0 ? (
        <EmptyState
          description="Todavía no realizaste pedidos."
          action={<TextLink to="/productos">Empezar a comprar</TextLink>}
        />
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
          {orders.map((order) => {
            const status = ORDER_STATUS_BADGES[order.status];
            return (
              <li key={order.id}>
                <Link
                  to={`/pedidos/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-stone-50"
                >
                  <div>
                    <p className="font-medium">
                      Pedido #{order.id}
                      {order.notes ? (
                        <span className="ml-2 font-normal text-stone-500">· {order.notes}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-stone-500">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{formatARS(order.total_cents)}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
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
