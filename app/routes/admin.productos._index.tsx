import { Form, useRouteLoaderData } from "react-router";

import { ConfirmButton } from "~/components/confirm-button";
import { CsrfToken } from "~/components/csrf-token";
import { Button, ButtonLink } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { TableShell } from "~/components/ui/table";
import { TextLink } from "~/components/ui/text-link";
import { formatARS } from "~/lib/money";
import type { ProductWithTiers } from "~/db/types";

// Listado de productos del panel. El loader y el action de activar/eliminar
// viven en el layout (admin.productos) porque el POST a /admin/productos se
// resuelve en esa ruta; acá solo se lee el loader del padre.

export default function AdminProducts() {
  const root = useRouteLoaderData("routes/admin.productos") as
    { products: ProductWithTiers[] } | undefined;
  const products = root?.products ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{products.length} productos</p>
        <ButtonLink to="/admin/productos/nuevo">Nuevo producto</ButtonLink>
      </div>

      {products.length === 0 ? (
        <EmptyState description="Todavía no hay productos." />
      ) : (
        <TableShell headers={["Producto", "Categoría", "Stock", "Escalas", "Estado", "Acciones"]}>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </TableShell>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: ProductWithTiers }) {
  const fromPrice = product.tiers[0]?.price_cents ?? null;

  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <TextLink to={`/admin/productos/${product.id}/editar`}>{product.name}</TextLink>
        <p className="text-stone-500">
          {product.slug} · {product.unit_label}
        </p>
        {product.package_size ? (
          <p className="text-xs text-stone-400">{product.package_size}</p>
        ) : null}
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
          <span className="block text-xs text-stone-400">desde {formatARS(fromPrice)}</span>
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
