import { data, Form, Link } from "react-router";
import type { Route } from "./+types/admin.pedidos.$id";

import { ConfirmButton } from "~/components/confirm-button";
import { CsrfToken } from "~/components/csrf-token";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { FormError } from "~/components/ui/form-error";
import { errorResponse } from "~/lib/action-utils.server";
import { formatDateTime } from "~/lib/dates";
import { findOrderWithItems, transitionOrderStatus, OrderError } from "~/db/repos/orders.server";
import { findUserById, toPublicUser } from "~/db/repos/users.server";
import type { OrderStatus } from "~/db/types";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { formatARS } from "~/lib/money";
import { ORDER_STATUS_BADGES, ORDER_TRANSITION_FLASH, type TransitionStatus } from "~/lib/order-ui";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export async function loader({ params }: Route.LoaderArgs) {
  const orderId = Number(params.id);
  if (!Number.isInteger(orderId)) throw data(null, { status: 404 });

  const order = findOrderWithItems(orderId);
  if (!order) throw data(null, { status: 404 });

  const user = findUserById(order.user_id);
  if (!user) throw data(null, { status: 404 });

  return { order, user: toPublicUser(user) };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const target = String(formData.get("intent") ?? "") as OrderStatus;

  const orderId = Number(params.id);
  const validTargets: OrderStatus[] = ["confirmed", "paid", "shipped", "cancelled"];
  if (!Number.isInteger(orderId) || !validTargets.includes(target)) {
    return errorResponse("Acción inválida.", 400);
  }

  const order = findOrderWithItems(orderId);
  if (!order) return errorResponse("El pedido no existe.", 400);

  let flashMessage: string;
  if (target === "paid" && order.status === "pending") {
    // "Confirmar y marcar pagado": descuenta stock (confirmar) y paga en la
    // misma request, respetando las transiciones unitarias del repo.
    try {
      transitionOrderStatus(orderId, "confirmed");
      transitionOrderStatus(orderId, "paid");
    } catch (error) {
      if (error instanceof OrderError) return errorResponse(error.message, 400);
      throw error;
    }
    flashMessage = "Pedido confirmado y marcado como pagado.";
  } else {
    try {
      transitionOrderStatus(orderId, target);
    } catch (error) {
      if (error instanceof OrderError) return errorResponse(error.message, 400);
      throw error;
    }
    flashMessage = ORDER_TRANSITION_FLASH[target as TransitionStatus];
  }

  return redirectWithFlash(`/admin/pedidos/${orderId}`, flashMessage);
}

export default function AdminOrderDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { order, user } = loaderData;
  const errors = (actionData as { errors?: Record<string, string> } | undefined)?.errors;
  const status = ORDER_STATUS_BADGES[order.status];

  return (
    <div>
      <nav className="mb-4 text-sm text-stone-500">
        <Link to="/admin/pedidos" className="transition-colors hover:text-brand-700">
          Pedidos
        </Link>
        <span className="mx-2">/</span>
        <span>#{order.id}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Pedido #{order.id}</h1>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="mb-6 text-sm text-stone-500">{formatDateTime(order.created_at)}</p>

      <FormError className="mb-4">{errors?._form}</FormError>

      {order.payment_notified_at ? (
        <Alert tone="success" padding="lg" className="mb-6">
          <h2 className="mb-1 text-base font-semibold text-emerald-900">
            El cliente declaró el pago
          </h2>
          <p className="text-emerald-800">
            Declaró haber transferido/depositado {formatARS(order.total_cents)} el{" "}
            {formatDateTime(order.payment_notified_at)}.
          </p>
          <dl className="mt-2 grid gap-1 text-stone-700">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Referencia</dt>
              <dd className="font-medium">{order.payment_reference}</dd>
            </div>
            {order.payment_message ? (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Mensaje</dt>
                <dd>{order.payment_message}</dd>
              </div>
            ) : null}
          </dl>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Datos del cliente: dirección y teléfono sirven para coordinar la entrega */}
        <Card title="Cliente" className="p-5">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Nombre</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Teléfono</dt>
              <dd>{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Provincia</dt>
              <dd>{user.province ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Dirección</dt>
              <dd>{user.address ?? "—"}</dd>
            </div>
          </dl>
          {order.notes ? (
            <div className="mt-4 border-t border-stone-100 pt-3 text-sm">
              <p className="text-stone-500">Notas del pedido</p>
              <p className="mt-1">{order.notes}</p>
            </div>
          ) : null}
        </Card>

        {/* Ítems del pedido */}
        <Card title="Ítems" className="p-5">
          <ul className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-10 w-10 rounded bg-stone-100 object-cover"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-stone-500">
                      {item.quantity} x {formatARS(item.unit_price_cents)}
                    </p>
                  </div>
                </div>
                <span className="font-medium">{formatARS(item.subtotal_cents)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="text-stone-600">Total</span>
            <span className="text-xl font-bold">{formatARS(order.total_cents)}</span>
          </div>
        </Card>
      </div>

      {order.status === "pending" || order.status === "confirmed" || order.status === "paid" ? (
        <Card className="mt-6 p-4">
          <Form method="post" className="flex flex-wrap items-center gap-3">
            <CsrfToken />
            {order.status === "pending" ? (
              <>
                {order.payment_notified_at ? (
                  <Button type="submit" name="intent" value="paid">
                    Confirmar y marcar pagado
                  </Button>
                ) : null}
                <Button type="submit" name="intent" value="confirmed" variant="secondary">
                  Confirmar pedido
                </Button>
                <ConfirmButton
                  type="submit"
                  name="intent"
                  value="cancelled"
                  confirmLabel="¿Cancelar?"
                  variant="danger"
                >
                  Cancelar pedido
                </ConfirmButton>
                <p className="text-sm text-stone-500">
                  Al confirmar se descuenta el stock de cada ítem.
                </p>
              </>
            ) : null}
            {order.status === "confirmed" ? (
              <Button type="submit" name="intent" value="paid">
                Marcar como pagado
              </Button>
            ) : null}
            {order.status === "paid" ? (
              <Button type="submit" name="intent" value="shipped">
                Enviar pedido
              </Button>
            ) : null}
            {order.status === "pending" ? (
              <p className="text-sm text-stone-500">
                Al confirmar se descuenta el stock de cada ítem.
              </p>
            ) : null}
          </Form>
        </Card>
      ) : null}
    </div>
  );
}
