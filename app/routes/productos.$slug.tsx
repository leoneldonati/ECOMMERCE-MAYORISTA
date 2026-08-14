import { data, Link, useFetcher } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/productos.$slug";

import { CsrfToken } from "~/components/csrf-token";
import { FetcherSubmitButton } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Page } from "~/components/ui/page";
import { findProductBySlug } from "~/db/repos/products.server";
import { getCurrentUser } from "~/lib/auth.server";
import { availabilityLabel } from "~/lib/availability";
import { toCatalogDetail } from "~/lib/catalog.server";
import { formatARS } from "~/lib/money";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = findProductBySlug(params.slug ?? "");
  if (!product || !product.active) throw data(null, { status: 404 });

  const user = await getCurrentUser(request);
  return { product: toCatalogDetail(product), loggedIn: user !== null };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { product } = loaderData;
  return [
    { title: `${product.name} — Impreso Online` },
    ...(product.description ? [{ name: "description", content: product.description }] : []),
  ];
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product, loggedIn } = loaderData;
  const [quantity, setQuantity] = useState(1);
  const fetcher = useFetcher();

  // La cantidad máxima depende del modo: los de stock no superan el disponible
  // y los de bajo pedido no tienen tope (se imprimen por encargo).
  const maxQty = product.made_to_order ? Number.MAX_SAFE_INTEGER : product.stock;
  function changeQuantity(value: number) {
    if (!Number.isFinite(value)) return setQuantity(1);
    const clamped = Math.max(1, Math.min(Math.floor(value), maxQty));
    setQuantity(clamped);
  }

  const outOfStock = product.availability === "out_of_stock";
  const tooMuch = !product.made_to_order && quantity > product.stock;
  const subtotal = product.price_cents * quantity;
  const canSubmit = loggedIn && quantity >= 1 && !outOfStock && !tooMuch;
  const feedback = (fetcher.data as { message?: string } | undefined)?.message;

  const stockTone =
    product.availability === "in_stock"
      ? "success"
      : product.availability === "made_to_order"
        ? "info"
        : "warning";

  return (
    <Page size="lg">
      <nav className="mb-6 text-sm text-stone-500">
        <Link to="/productos" className="transition-colors hover:text-brand-700">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/productos?categoria=${product.category_slug}`}
          className="transition-colors hover:text-brand-700"
        >
          {product.category_name}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full rounded-lg bg-stone-100 object-cover"
          />
        ) : null}

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <Badge tone={stockTone} className="mt-2">
            {availabilityLabel(product.availability, product.lead_time_days)}
          </Badge>
          <p className="mt-4 text-2xl font-semibold">{formatARS(product.price_cents)}</p>
          {product.description ? (
            <p className="mt-3 text-stone-600">{product.description}</p>
          ) : null}

          <Card className="mt-6 p-4">
            <div className="flex items-end gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-600">Cantidad</span>
                <input
                  type="number"
                  min={1}
                  max={product.made_to_order ? undefined : product.stock}
                  step={1}
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => changeQuantity(Number(event.target.value))}
                  className="w-24 rounded-md border border-stone-300 px-3 py-2 text-base"
                />
              </label>

              <div className="text-sm">
                <p className="text-stone-500">
                  {formatARS(product.price_cents)} x {quantity}
                </p>
                <p className="text-lg font-bold">{formatARS(subtotal)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <fetcher.Form method="post" action="/carrito">
                <input type="hidden" name="intent" value="add-to-cart" />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="quantity" value={quantity} />
                <CsrfToken />
                <FetcherSubmitButton
                  fetcher={fetcher}
                  pendingLabel="Agregando…"
                  disabled={!canSubmit}
                >
                  Agregar al carrito
                </FetcherSubmitButton>
              </fetcher.Form>
              {!loggedIn ? (
                <span className="text-sm text-stone-500">Iniciá sesión para comprar.</span>
              ) : null}
              {tooMuch ? (
                <span className="text-sm text-red-600">Supera el stock disponible.</span>
              ) : null}
            </div>

            {feedback ? (
              <p className="mt-3 text-sm font-medium text-emerald-700">{feedback}</p>
            ) : null}
          </Card>
        </div>
      </div>
    </Page>
  );
}
