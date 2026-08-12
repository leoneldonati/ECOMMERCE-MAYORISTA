import { data, Form, Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/carrito";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { TextareaField } from "~/components/ui/field";
import { FormError } from "~/components/ui/form-error";
import { Alert } from "~/components/ui/alert";
import { Page } from "~/components/ui/page";
import { TextLink } from "~/components/ui/text-link";
import { errorResponse } from "~/lib/action-utils.server";
import { listCartWithProducts, removeItem, upsertItem } from "~/db/repos/cart.server";
import { createOrderFromCart, OrderError } from "~/db/repos/orders.server";
import { getContextUser, requireApproved } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { formatARS } from "~/lib/money";
import {
  computeCartTotal,
  lineMinQty,
  lineUnitPrice,
  MIN_ORDER_CENTS,
  shortfallToMin,
} from "~/lib/orders";

export const middleware: Route.MiddlewareFunction[] = [requireApproved];

export async function loader({ context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  const lines = listCartWithProducts(user.id);

  const viewLines = lines.map(({ product_id, quantity, product }) => {
    const unitPrice = lineUnitPrice(product.tiers, quantity);
    return {
      product_id,
      quantity,
      slug: product.slug,
      name: product.name,
      package_size: product.package_size,
      unit_label: product.unit_label,
      stock: product.stock,
      unitPrice,
      subtotal: unitPrice !== null ? unitPrice * quantity : null,
      belowMin: unitPrice === null,
      minQty: lineMinQty(product.tiers),
    };
  });

  const total = computeCartTotal(
    lines.map((line) => ({ quantity: line.quantity, tiers: line.product.tiers })),
  );
  return { lines: viewLines, total, shortfall: shortfallToMin(total) };
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
      // Si no quedan líneas, ordenará el estado vacío.
    }
    return data({ ok: true });
  }

  if (intent === "create-order") {
    const notes = String(formData.get("notes") ?? "").trim() || undefined;
    try {
      const order = createOrderFromCart(user.id, notes);
      return redirect(`/pedidos/${order.id}`);
    } catch (error) {
      if (error instanceof OrderError) return errorResponse(error.message, 400);
      throw error;
    }
  }

  return errorResponse("Acción desconocida.", 400);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Carrito — Despensa Online" }];
}

type CartViewLine = Awaited<ReturnType<typeof loader>>["lines"][number];

function CartLineRow({ line }: { line: CartViewLine }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

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
    <li className="border-t border-stone-100 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to={`/productos/${line.slug}`} className="font-medium hover:text-brand-700">
            {line.name}
          </Link>
          <p className="text-sm text-stone-500">
            {line.package_size} · {line.unit_label}
          </p>
        </div>
        {line.belowMin ? (
          <Badge tone="warning">Mínimo {line.minQty} por línea</Badge>
        ) : (
          <span className="font-semibold">{formatARS(line.subtotal!)}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {qtyForm(line.quantity - 1)}
          <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
          {qtyForm(line.quantity + 1, line.quantity >= line.stock)}
          <span className="ml-2 text-sm text-stone-500">
            {line.unitPrice !== null ? `${formatARS(line.unitPrice)} x unidad` : ""}
          </span>
        </div>
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
  const { lines, total, shortfall } = loaderData;
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

          {shortfall > 0 ? (
            <Alert tone="warning" className="mt-3">
              Te faltan {formatARS(shortfall)} para el pedido mínimo de {formatARS(MIN_ORDER_CENTS)}
              .
            </Alert>
          ) : null}

          <Card className="mt-6 p-4">
            <Form method="post" action="/carrito" className="flex flex-col gap-3">
              <input type="hidden" name="intent" value="create-order" />
              <CsrfToken />
              <TextareaField
                label="Notas (opcional)"
                name="notes"
                rows={2}
                placeholder="Horario de entrega, aclaraciones…"
              />
              <SubmitButton
                pendingLabel="Creando pedido…"
                disabled={shortfall > 0 || lines.some((line) => line.belowMin)}
              >
                Realizar pedido
              </SubmitButton>
            </Form>
          </Card>
        </>
      )}
    </Page>
  );
}
