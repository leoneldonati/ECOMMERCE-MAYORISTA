import { data, Link, useFetcher } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/productos.$slug";

import { CsrfToken } from "~/components/csrf-token";
import { PricesNotice } from "~/components/prices-notice";
import { findProductBySlug } from "~/db/repos/products.server";
import { getCurrentUser } from "~/lib/auth.server";
import { catalogVisibility, toCatalogDetail } from "~/lib/catalog.server";
import { formatARS } from "~/lib/money";
import { lineUnitPrice } from "~/lib/orders";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = findProductBySlug(params.slug ?? "");
  if (!product || !product.active) throw data(null, { status: 404 });

  const user = await getCurrentUser(request);
  const { canSeePrices, pricesNotice } = catalogVisibility(user);
  // Solo los aprobados (o admin) pueden agregar al carrito.
  const canBuy = user !== null && (user.role === "admin" || user.status === "approved");

  return { product: toCatalogDetail(product, canSeePrices), pricesNotice, canBuy };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { product } = loaderData;
  return [
    { title: `${product.name} — MayoristaAR` },
    ...(product.description ? [{ name: "description", content: product.description }] : []),
  ];
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product, pricesNotice, canBuy } = loaderData;
  const [quantity, setQuantity] = useState(product.tiers[0]?.min_qty ?? 1);
  const fetcher = useFetcher();

  const unitPrice = lineUnitPrice(product.tiers, quantity);
  const subtotal = unitPrice !== null ? unitPrice * quantity : null;
  const belowMin = unitPrice === null;
  const tooMuch = product.stock !== null && quantity > product.stock;
  const canSubmit = canBuy && quantity >= 1 && !tooMuch;
  const feedback = (fetcher.data as { message?: string } | undefined)?.message;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-stone-500">
        <Link to="/productos" className="transition-colors hover:text-amber-700">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/productos?categoria=${product.category_slug}`}
          className="transition-colors hover:text-amber-700"
        >
          {product.category_name}
        </Link>
      </nav>

      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {product.package_size} · {product.unit_label}
      </p>
      {product.description ? <p className="mt-4 text-stone-600">{product.description}</p> : null}

      {product.stock !== null ? (
        <p className="mt-2 text-sm text-stone-600">
          Stock disponible: {product.stock} {product.unit_label}
          {product.stock === 1 ? "" : "s"}
        </p>
      ) : null}

      {product.canSeePrices ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Escalas de precio</h2>
          <table className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">Cantidad</th>
                <th className="px-4 py-2 font-medium">Precio por {product.unit_label}</th>
              </tr>
            </thead>
            <tbody>
              {product.tiers.map((tier) => (
                <tr key={tier.min_qty} className="border-t border-stone-100">
                  <td className="px-4 py-2">
                    Desde {tier.min_qty} {product.unit_label}
                    {tier.min_qty === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {tier.price_cents !== null ? formatARS(tier.price_cents) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canBuy ? (
            <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-end gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-stone-600">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="w-24 rounded-md border border-stone-300 px-3 py-2 text-base"
                  />
                </label>

                <div className="text-sm">
                  {subtotal !== null ? (
                    <>
                      <p className="text-stone-500">
                        {formatARS(unitPrice!)} x {quantity}
                      </p>
                      <p className="text-lg font-bold">{formatARS(subtotal)}</p>
                    </>
                  ) : (
                    <p className="font-medium text-amber-700">
                      Mínimo {product.tiers[0]?.min_qty} por línea para que aplique una escala.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <fetcher.Form method="post" action="/carrito">
                  <input type="hidden" name="intent" value="add-to-cart" />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="quantity" value={quantity} />
                  <CsrfToken />
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-md bg-amber-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Agregar al carrito
                  </button>
                </fetcher.Form>
                {belowMin ? (
                  <span className="text-sm text-amber-700">
                    Se agregará, pero el mínimo por línea se exige al confirmar el pedido.
                  </span>
                ) : null}
                {tooMuch ? (
                  <span className="text-sm text-red-600">
                    Supera el stock disponible.
                  </span>
                ) : null}
              </div>

              {feedback ? <p className="mt-3 text-sm font-medium text-emerald-700">{feedback}</p> : null}
            </div>
          ) : null}
        </section>
      ) : pricesNotice ? (
        <div className="mt-8">
          <PricesNotice status={pricesNotice} />
        </div>
      ) : null}
    </div>
  );
}