import { data } from "react-router";
import type { Route } from "./+types/favoritos";

import { ProductCard } from "~/components/product-card";
import { EmptyState } from "~/components/ui/empty-state";
import { Page } from "~/components/ui/page";
import { TextLink } from "~/components/ui/text-link";
import { errorResponse } from "~/lib/action-utils.server";
import { toCatalogItem } from "~/lib/catalog.server";
import { requireCsrf } from "~/lib/csrf.server";
import { listFavoriteProducts, toggleFavorite } from "~/db/repos/favorites.server";
import { getContextUser, requireUser } from "~/lib/middleware.server";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export async function loader({ context }: Route.LoaderArgs) {
  const user = getContextUser(context);
  const products = listFavoriteProducts(user.id);
  return { items: products.map(toCatalogItem) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireCsrf(request);
  const user = getContextUser(context);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "toggle") {
    const productId = Number(formData.get("productId"));
    if (!Number.isInteger(productId) || productId <= 0) {
      return errorResponse("Producto inválido.", 400);
    }
    try {
      const favorited = toggleFavorite(user.id, productId);
      return data({ ok: true, favorited });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "No se pudo actualizar.", 400);
    }
  }

  return errorResponse("Acción desconocida.", 400);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mis favoritos — Impreso Online" }];
}

export default function Favorites({ loaderData }: Route.ComponentProps) {
  const { items } = loaderData;

  return (
    <Page size="xl">
      <h1 className="mb-6 text-2xl font-bold">Mis favoritos</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Todavía no tenés favoritos"
          description="Marcá productos con el corazón para tenerlos a mano."
          action={<TextLink to="/productos">Ver el catálogo</TextLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} favorited loggedIn />
          ))}
        </div>
      )}
    </Page>
  );
}
