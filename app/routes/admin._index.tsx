import { Link } from "react-router";
import type { Route } from "./+types/admin._index";

import { Card } from "~/components/ui/card";
import { listProducts } from "~/db/repos/products.server";
import { listUsers } from "~/db/repos/users.server";
import { listOrdersWithUser } from "~/db/repos/orders.server";

interface Card {
  to: string;
  label: string;
  value: string | number;
  hint: string;
}

export async function loader({}: Route.LoaderArgs) {
  const [users, orders, products] = await Promise.all([
    listUsers("pending"),
    listOrdersWithUser(),
    listProducts(),
  ]);

  const byStatus = (status: string) => orders.filter((order) => order.status === status).length;

  return {
    pendingClients: users.length,
    pendingOrders: byStatus("pending"),
    paidOrders: byStatus("paid"),
    outOfStock: products.filter((product) => product.stock === 0).length,
  };
}

export default function AdminOverview({ loaderData }: Route.ComponentProps) {
  const { pendingClients, pendingOrders, paidOrders, outOfStock } = loaderData;

  const cards: Card[] = [
    {
      to: "/admin/clientes?estado=pending",
      label: "Clientes pendientes",
      value: pendingClients,
      hint: "Cuentas esperando aprobación",
    },
    {
      to: "/admin/pedidos?estado=pending",
      label: "Pedidos pendientes",
      value: pendingOrders,
      hint: "Esperando confirmación",
    },
    {
      to: "/admin/pedidos?estado=paid",
      label: "Pedidos pagados",
      value: paidOrders,
      hint: "Pendientes de envío",
    },
    {
      to: "/admin/productos",
      label: "Productos sin stock",
      value: outOfStock,
      hint: "Catalogados en 0",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} to={card.to} className="block">
          <Card className="p-5 transition-colors hover:border-brand-300">
            <p className="text-3xl font-bold text-stone-900">{card.value}</p>
            <p className="mt-1 font-medium text-stone-700">{card.label}</p>
            <p className="text-sm text-stone-500">{card.hint}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
