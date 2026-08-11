import { Form, Link } from "react-router";
import type { Route } from "./+types/productos._index";

import { ProductCard } from "~/components/product-card";
import { listCategoriesWithActiveCounts } from "~/db/repos/categories.server";
import { listProducts } from "~/db/repos/products.server";
import { getCurrentUser } from "~/lib/auth.server";
import { catalogVisibility, toCatalogItem } from "~/lib/catalog.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const categoria = url.searchParams.get("categoria") ?? "";

  const user = await getCurrentUser(request);
  const { canSeePrices, pricesNotice } = catalogVisibility(user);

  const [categories, products] = await Promise.all([
    listCategoriesWithActiveCounts(),
    listProducts({ activeOnly: true, categorySlug: categoria || undefined, search: q || undefined }),
  ]);

  return {
    items: products.map((product) => toCatalogItem(product, canSeePrices)),
    categories,
    q,
    categoria,
    pricesNotice,
  };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catálogo — MayoristaAR" }];
}

function href(categoria: string, q: string): string {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (q) params.set("q", q);
  const search = params.toString();
  return search ? `/productos?${search}` : "/productos";
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  const { items, categories, q, categoria, pricesNotice } = loaderData;
  const total = categories.reduce((sum, category) => sum + category.product_count, 0);

  const chipClass = (active: boolean) =>
    active
      ? "rounded-full bg-amber-600 px-3 py-1 font-medium text-white"
      : "rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 transition-colors hover:border-amber-400";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Catálogo mayorista</h1>
        <p className="mt-1 text-sm text-stone-600">
          Precios mayoristas en ARS con escalas por cantidad de cajas.
        </p>
      </header>

      <Form method="get" className="mb-6 flex max-w-md gap-2">
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar producto…"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-base"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-700"
        >
          Buscar
        </button>
      </Form>

      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        <Link to={href("", q)} className={chipClass(!categoria)}>
          Todos · {total}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={href(category.slug, q)}
            className={chipClass(categoria === category.slug)}
          >
            {category.name} · {category.product_count}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-md border border-stone-200 bg-white px-4 py-8 text-center text-stone-600">
          No se encontraron productos con esos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProductCard key={item.slug} item={item} pricesNotice={pricesNotice} />
          ))}
        </div>
      )}
    </div>
  );
}