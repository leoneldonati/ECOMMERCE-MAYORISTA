import { data, Form, Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/carrito";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { TextareaField } from "~/components/ui/field";
import { FormError } from "~/components/ui/form-error";
import { Page } from "~/components/ui/page";
import { TextLink } from "~/components/ui/text-link";
import { errorResponse } from "~/lib/action-utils.server";
import { notifyOrderCreated } from "~/lib/notify.server";
import { listCartWithProducts, removeItem, upsertItem } from "~/db/repos/cart.server";
import { createOrderFromCart, OrderError } from "~/db/repos/orders.server";
import { getContextUser, requireUser } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { formatARS } from "~/lib/money";
import { computeCartTotal } from "~/lib/orders";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export async function loader({ context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  const lines = listCartWithProducts(user.id);

  const viewLines = lines.map(({ product_id, quantity, product }) => ({
    product_id,
    quantity,
    slug: product.slug,
    name: product.name,
    image_url: product.image_url,
    priceCents: product.price_cents,
    subtotal: product.price_cents * quantity,
    // El tope de cantidad solo aplica a productos de stock; los de bajo pedido
    // se imprimen por encargo y no tienen límite.
    madeToOrder: product.made_to_order === 1,
    stock: product.stock,
  }));

  const total = computeCartTotal(
    lines.map((line) => ({ quantity: line.quantity, priceCents: line.product.price_cents })),
  );
  return { lines: viewLines, total };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const user = getContextUser(context);

  if (intent === "add-to-cart" || intent === "update-qty") {
    const productId = Number(formData.get("productId"));
    const quantity = Number(formData.get("quantity"));
    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return errorResponse("Cantidad inválida.", 400);
    }
    try {
      upsertItem(user.id, productId, quantity);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "No se pudo actualizar el carrito.",
        400,
      );
    }
    return intent === "add-to-cart"
      ? data({ ok: true, message: "Agregado al carrito." })
      : data({ ok: true });
  }

  if (intent === "remove") {
    const productId = Number(formData.get("productId"));
    if (Number.isInteger(productId) && productId > 0) {
      removeItem(user.id, productId);
    }
    return data({ ok: true });
  }

  if (intent === "create-order") {
    const notes = String(formData.get("notes") ?? "").trim() || undefined;
    try {
      const order = createOrderFromCart(user.id, notes);
      // Notificar al admin; la notificación nunca debe romper el pedido.
      try {
        await notifyOrderCreated(order, user.name, order.items.length);
      } catch (error) {
        console.error(`[notify] ${error instanceof Error ? error.message : error}`);
      }
      return redirect(`/pedidos/${order.id}`);
    } catch (error) {
      if (error instanceof OrderError) return errorResponse(error.message, 400);
      throw error;
    }
  }

  return errorResponse("Acción desconocida.", 400);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Carrito — Impreso Online" }];
}

type CartViewLine = Awaited<ReturnType<typeof loader>>["lines"][number];

function CartLineRow({ line }: { line: CartViewLine }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  // El tope de stock solo aplica a productos de depósito (no bajo pedido).
  const atMax = !line.madeToOrder && line.quantity >= line.stock;

  const qtyForm = (nextQuantity: number, disabledMax = false) => (
    <fetcher.Form method="post" action="/carrito" className="inline-flex items-center gap-2">
      <input type="hidden" name="intent" value="update-qty" />
      <input type="hidden" name="productId" value={line.product_id} />
      <input type="hidden" name="quantity" value={nextQuantity} />
      <CsrfToken />
      <button
        type="submit"
        disabled={busy || disabledMax || nextQuantity <= 0}
        className="rounded border border-stone-300 px-2 py-0.5 text-sm disabled:opacity-40"
      >
        −
      </button>
    </fetcher.Form>
  );

  return (
    <li className="flex items-center justify-between gap-4 border-t border-stone-100 p-4">
      <div className="flex min-w-0 items-center gap-3">
        {line.image_url ? (
          <img
            src={line.image_url}
            alt={line.name}
            className="h-14 w-14 rounded bg-stone-100 object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <Link
            to={`/productos/${line.slug}`}
            className="block truncate font-medium hover:text-brand-700"
          >
            {line.name}
          </Link>
          <p className="text-sm text-stone-500">
            {formatARS(line.priceCents)} x {line.quantity}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {qtyForm(line.quantity - 1)}
          <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
          {qtyForm(line.quantity + 1, atMax)}
        </div>
        <span className="w-24 text-right font-semibold">{formatARS(line.subtotal)}</span>
        <fetcher.Form method="post" action="/carrito">
          <input type="hidden" name="intent" value="remove" />
          <input type="hidden" name="productId" value={line.product_id} />
          <CsrfToken />
          <button
            type="submit"
            disabled={busy}
            className="text-sm text-stone-500 underline-offset-2 hover:text-red-600 hover:underline"
          >
            Quitar
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}

export default function Cart({ loaderData, actionData }: Route.ComponentProps) {
  const { lines, total } = loaderData;
  const errors = (actionData as { errors?: Record<string, string> } | undefined)?.errors;

  return (
    <Page size="lg">
      <h1 className="mb-6 text-2xl font-bold">Carrito</h1>

      {lines.length === 0 ? (
        <>
          <FormError className="mb-4">{errors?._form}</FormError>
          <EmptyState
            title="Tu carrito está vacío"
            description="Sumá productos del catálogo para armar tu pedido."
            action={<TextLink to="/productos">Ver el catálogo</TextLink>}
          />
        </>
      ) : (
        <>
          <FormError className="mb-4">{errors?._form}</FormError>

          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {lines.map((line) => (
              <CartLineRow key={line.product_id} line={line} />
            ))}
          </ul>

          <Card className="mt-4 flex items-center justify-between p-4">
            <span className="text-stone-600">Total</span>
            <span className="text-xl font-bold">{formatARS(total)}</span>
          </Card>

          <Card className="mt-6 p-4">
            <Form method="post" action="/carrito" className="flex flex-col gap-3">
              <input type="hidden" name="intent" value="create-order" />
              <CsrfToken />
              <TextareaField
                label="Notas (opcional)"
                name="notes"
                rows={2}
                placeholder="Aclaraciones, retiro, envío…"
              />
              <SubmitButton pendingLabel="Creando pedido…">Realizar pedido</SubmitButton>
            </Form>
          </Card>
        </>
      )}
    </Page>
  );
}
