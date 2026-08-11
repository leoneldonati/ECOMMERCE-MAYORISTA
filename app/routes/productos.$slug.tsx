import { data, Link } from "react-router";
import type { Route } from "./+types/productos.$slug";

import { PricesNotice } from "~/components/prices-notice";
import { findProductBySlug } from "~/db/repos/products.server";
import { getCurrentUser } from "~/lib/auth.server";
import { catalogVisibility, toCatalogDetail } from "~/lib/catalog.server";
import { formatARS } from "~/lib/money";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = findProductBySlug(params.slug ?? "");
  if (!product || !product.active) throw data(null, { status: 404 });

  const user = await getCurrentUser(request);
  const { canSeePrices, pricesNotice } = catalogVisibility(user);

  return { product: toCatalogDetail(product, canSeePrices), pricesNotice };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { product } = loaderData;
  return [
    { title: `${product.name} — MayoristaAR` },
    ...(product.description ? [{ name: "description", content: product.description }] : []),
  ];
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product, pricesNotice } = loaderData;

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

      {product.canSeePrices ? (
        <section className="mt-8">
          {product.stock !== null ? (
            <p className="mb-2 text-sm text-stone-600">
              Stock: {product.stock} {product.unit_label}
              {product.stock === 1 ? "" : "s"}
            </p>
          ) : null}

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
        </section>
      ) : pricesNotice ? (
        <div className="mt-8">
          <PricesNotice status={pricesNotice} />
        </div>
      ) : null}
    </div>
  );
}