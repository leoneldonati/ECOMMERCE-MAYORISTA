import { data, Form, Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/carrito";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { listCartWithProducts, removeItem, upsertItem } from "~/db/repos/cart.server";
import { createOrderFromCart, OrderError } from "~/db/repos/orders.server";
import { getContextUser, requireApproved } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { formatARS } from "~/lib/money";
import { computeCartTotal, lineMinQty, lineUnitPrice, MIN_ORDER_CENTS, shortfallToMin } from "~/lib/orders";

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

function errorResponse(message: string, status: number) {
  return data({ errors: { _form: message } }, { status });
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const user = getContextUser(context);

  if (intent === "add-to-cart" || intent === "update-qty") {
    const productId = Number(formData.get("productId"));
    const quantity = Number(formData.get("quantity"));
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return errorResponse("Cantidad inválida.", 400);
    }
    try {
      upsertItem(user.id, productId, quantity);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "No se pudo actualizar el carrito.", 400);
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

  const qtyForm = (nextQuantity: number) => (
    <fetcher.Form method="post" action="/carrito" className="inline-flex items-center gap-2">
      <input type="hidden" name="intent" value="update-qty" />
      <input type="hidden" name="productId" value={line.product_id} />
      <input type="hidden" name="quantity" value={nextQuantity} />
      <CsrfToken />
      <button
        type="submit"
        disabled={busy || nextQuantity <= 0}
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
          {qtyForm(line.quantity + 1)}
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Carrito</h1>

      {lines.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-10 text-center">
          {errors?._form ? <p className="mb-3 text-sm text-red-600">{errors._form}</p> : null}
          <p className="mb-4 text-stone-600">Tu carrito está vacío.</p>
            <Link to="/productos" className="font-medium text-brand-700 hover:underline">
              Ver el catálogo
            </Link>
        </div>
      ) : (
        <>
          {errors?._form ? (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors._form}</p>
          ) : null}

          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {lines.map((line) => (
              <CartLineRow key={line.product_id} line={line} />
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
            <span className="text-stone-600">Total</span>
            <span className="text-xl font-bold">{formatARS(total)}</span>
          </div>

          {shortfall > 0 ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Te faltan {formatARS(shortfall)} para el pedido mínimo de {formatARS(MIN_ORDER_CENTS)}.
            </p>
          ) : null}

          <Form method="post" action="/carrito" className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
            <input type="hidden" name="intent" value="create-order" />
            <CsrfToken />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-stone-600">Notas (opcional)</span>
              <textarea
                name="notes"
                rows={2}
                className="rounded-md border border-stone-300 px-3 py-2 text-base"
                placeholder="Horario de entrega, aclaraciones…"
              />
            </label>
            <SubmitButton
              pendingLabel="Creando pedido…"
              disabled={shortfall > 0 || lines.some((line) => line.belowMin)}
              className="mt-4"
            >
              Realizar pedido
            </SubmitButton>
          </Form>
        </>
      )}
    </div>
  );
}