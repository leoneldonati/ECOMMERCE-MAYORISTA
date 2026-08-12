import { Form, Link, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/admin.productos._index";

import { ConfirmButton } from "~/components/confirm-button";
import { CsrfToken } from "~/components/csrf-token";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { ProductWithTiers } from "~/db/types";

// Listado de productos del panel. El loader y el action de activar/eliminar
// viven en el layout (admin.productos) porque el POST a /admin/productos se
// resuelve en esa ruta; acá solo se lee el loader del padre.

export default function AdminProducts() {
  const root = useRouteLoaderData("routes/admin.productos") as
    | { products: ProductWithTiers[] }
    | undefined;
  const products = root?.products ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{products.length} productos</p>
        <Link
          to="/admin/productos/nuevo"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white px-4 py-10 text-center text-stone-600">
          Todavía no hay productos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2 font-medium">Escalas</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: ProductWithTiers }) {
  const fromPrice = product.tiers[0]?.price_cents ?? null;

  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <Link
          to={`/admin/productos/${product.id}/editar`}
          className="font-medium text-brand-700 hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-stone-500">
          {product.slug} · {product.unit_label}
        </p>
        {product.package_size ? <p className="text-xs text-stone-400">{product.package_size}</p> : null}
      </td>
      <td className="px-4 py-3 text-stone-600">{product.category_name ?? "—"}</td>
      <td className="px-4 py-3">
        <span className={product.stock === 0 ? "font-medium text-red-700" : "text-stone-700"}>
          {product.stock}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-600">
        {product.tiers.length} {product.tiers.length === 1 ? "escala" : "escalas"}
        {fromPrice !== null ? (
          <span className="block text-xs text-stone-400">
            desde ${(fromPrice / 100).toLocaleString("es-AR")}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <Badge tone={product.active === 1 ? "success" : "neutral"}>
          {product.active === 1 ? "Activo" : "Inactivo"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Form method="post">
            <input type="hidden" name="intent" value="toggle" />
            <input type="hidden" name="productId" value={product.id} />
            <CsrfToken />
            <Button type="submit" variant="secondary" size="sm">
              {product.active === 1 ? "Desactivar" : "Activar"}
            </Button>
          </Form>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="productId" value={product.id} />
            <CsrfToken />
            <ConfirmButton type="submit" confirmLabel="¿Eliminar?" variant="danger" size="sm">
              Eliminar
            </ConfirmButton>
          </Form>
        </div>
      </td>
    </tr>
  );
}