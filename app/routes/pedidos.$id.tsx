import { data, Form, Link } from "react-router";
import type { Route } from "./+types/pedidos.$id";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { Alert } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { TextField, TextareaField } from "~/components/ui/field";
import { FormError } from "~/components/ui/form-error";
import { errorResponse } from "~/lib/action-utils.server";
import { notifyPaymentReceived } from "~/lib/notify.server";
import { findOrderWithItems, notifyPayment, OrderError } from "~/db/repos/orders.server";
import { requireCsrf } from "~/lib/csrf.server";
import { formatDateTime } from "~/lib/dates";
import { redirectWithFlash } from "~/lib/flash.server";
import { getContextUser, requireApproved } from "~/lib/middleware.server";
import { formatARS } from "~/lib/money";
import { PAYMENT_INFO } from "~/lib/orders";
import { ORDER_STATUS_BADGES } from "~/lib/order-ui";
import { fieldErrors, paymentNotificationSchema } from "~/lib/validation.server";

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

export async function action({ request, params, context }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  const user = getContextUser(context);
  const orderId = Number(params.id);
  if (!Number.isInteger(orderId)) return errorResponse("Acción inválida.", 400);

  // Misma protección de ownership que el loader: solo el dueño puede avisar.
  const order = findOrderWithItems(orderId);
  if (!order || order.user_id !== user.id) throw data(null, { status: 404 });

  if (intent === "notify-payment") {
    const parsed = paymentNotificationSchema.safeParse({
      reference: formData.get("payment_reference"),
      message: formData.get("payment_message"),
    });
    if (!parsed.success) {
      return data({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }

    try {
      notifyPayment(orderId, {
        reference: parsed.data.reference,
        message: parsed.data.message,
      });
      // Notificar al admin; la notificación nunca debe romper el aviso.
      try {
        await notifyPaymentReceived(order, {
          reference: parsed.data.reference,
          message: parsed.data.message,
        });
      } catch (error) {
        console.error(`[notify] ${error instanceof Error ? error.message : error}`);
      }
    } catch (error) {
      if (error instanceof OrderError) return errorResponse(error.message, 400);
      throw error;
    }
    return redirectWithFlash(`/pedidos/${orderId}`, "Aviso de pago enviado al admin.");
  }

  return errorResponse("Acción inválida.", 400);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { order } = loaderData;
  return [{ title: `Pedido #${order.id} — Despensa Online` }];
}

export default function OrderDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { order } = loaderData;
  const status = ORDER_STATUS_BADGES[order.status];
  const errors = (actionData as { errors?: Record<string, string> } | undefined)?.errors;
  const notified = order.payment_notified_at !== null;

  return (
    <>
      <nav className="mb-4 text-sm text-stone-500">
        <Link to="/pedidos" className="transition-colors hover:text-brand-700">
          Mis pedidos
        </Link>
      </nav>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pedido #{order.id}</h1>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <p className="mb-6 text-sm text-stone-500">{formatDateTime(order.created_at)}</p>

      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-sm text-stone-500">
                {item.package_size ? `${item.package_size} · ` : ""}
                {item.quantity} x {formatARS(item.unit_price_cents)} ={" "}
                {formatARS(item.subtotal_cents)}
              </p>
            </div>
            <span className="font-medium">{formatARS(item.subtotal_cents)}</span>
          </li>
        ))}
      </ul>

      <Card className="mt-4 flex items-center justify-between p-4">
        <span className="text-stone-600">Total</span>
        <span className="text-xl font-bold">{formatARS(order.total_cents)}</span>
      </Card>

      {order.status === "pending" ? (
        <div className="mt-6 space-y-4">
          <Alert tone="warning" padding="lg">
            <h2 className="mb-2 text-base font-semibold">Datos para el pago</h2>
            <p className="mb-3 text-amber-800">
              Transferí o depositá {formatARS(order.total_cents)} a la siguiente cuenta. Cuando lo
              hagas, avisanos abajo con el número de comprobante para que el admin confirme el
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
          </Alert>

          {notified ? (
            <Alert tone="success" padding="lg">
              <h2 className="mb-1 text-base font-semibold">Pago declarado</h2>
              <p className="text-emerald-800">
                Ya avisaste que transferiste el {formatDateTime(order.payment_notified_at!)}. El
                admin lo está verificando; el pedido pasará a estado <strong>pagado</strong> cuando
                se acredite.
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

          <Card className="p-4">
            <Form method="post" className="flex flex-col gap-3">
              <CsrfToken />
              <h2 className="text-base font-semibold">
                {notified ? "Corregir aviso de pago" : "Avisar el pago"}
              </h2>
              <FormError>{errors?._form}</FormError>
              <div className="grid gap-3">
                <TextField
                  label="N° de transferencia o comprobante"
                  name="payment_reference"
                  defaultValue={order.payment_reference ?? ""}
                  error={errors?.payment_reference}
                  required
                  autoComplete="off"
                />
                <TextareaField
                  label="Mensaje (opcional)"
                  name="payment_message"
                  defaultValue={order.payment_message ?? ""}
                  error={errors?.payment_message}
                  rows={2}
                  placeholder="Por ejemplo: deposité desde el Banco Nación."
                />
                <div>
                  <SubmitButton name="intent" value="notify-payment" pendingLabel="Enviando…">
                    {notified ? "Guardar corrección" : "Ya transferí / Deposité"}
                  </SubmitButton>
                </div>
              </div>
            </Form>
          </Card>
        </div>
      ) : null}
    </>
  );
}
