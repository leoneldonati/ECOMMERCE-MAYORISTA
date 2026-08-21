import { Form, Link } from "react-router";
import type { Route } from "./+types/productos._index";

import { ProductCard } from "~/components/product-card";
import { EmptyState } from "~/components/ui/empty-state";
import { Page } from "~/components/ui/page";
import { TextLink } from "~/components/ui/text-link";
import { listCategoriesWithActiveCounts } from "~/db/repos/categories.server";
import { listProducts } from "~/db/repos/products.server";
import { getCurrentUser } from "~/lib/auth.server";
import { listFavoriteProductIds } from "~/db/repos/favorites.server";
import { toCatalogItem } from "~/lib/catalog.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const categoria = url.searchParams.get("categoria") ?? "";

  const user = await getCurrentUser(request);
  const [categories, products, favoriteIds] = await Promise.all([
    listCategoriesWithActiveCounts(),
    listProducts({
      activeOnly: true,
      categorySlug: categoria || undefined,
      search: q || undefined,
    }),
    user ? listFavoriteProductIds(user.id) : Promise.resolve([]),
  ]);

  const favorites = new Set(favoriteIds);
  return {
    items: products.map(toCatalogItem),
    categories,
    q,
    categoria,
    loggedIn: user !== null,
    favorites,
  };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catálogo — Impreso Online" }];
}

function href(categoria: string, q: string): string {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (q) params.set("q", q);
  const search = params.toString();
  return search ? `/productos?${search}` : "/productos";
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  const { items, categories, q, categoria, loggedIn, favorites } = loaderData;
  const total = categories.reduce((sum, category) => sum + category.product_count, 0);

  const chipClass = (active: boolean) =>
    active
      ? "rounded-full bg-brand-700 px-3 py-1 font-medium text-white"
      : "rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 transition-colors hover:border-brand-400";

  return (
    <Page size="xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="mt-1 text-sm text-stone-600">
          Productos impresos en 3D, en stock o bajo pedido. Precios en ARS por unidad.
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
        <EmptyState
          description="No se encontraron productos con esos filtros."
          action={<TextLink to={href("", "")}>Limpiar filtros</TextLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProductCard
              key={item.slug}
              item={item}
              loggedIn={loggedIn}
              favorited={favorites.has(item.id)}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
