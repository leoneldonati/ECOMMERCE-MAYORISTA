import { Form, useRouteLoaderData } from "react-router";

import { ConfirmButton } from "~/components/confirm-button";
import { CsrfToken } from "~/components/csrf-token";
import { Button, ButtonLink } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { TableShell } from "~/components/ui/table";
import { TextLink } from "~/components/ui/text-link";
import { availabilityLabel } from "~/lib/availability";
import { formatARS } from "~/lib/money";
import type { Product } from "~/db/types";

// Listado de productos del panel. El loader y el action de activar/eliminar
// viven en el layout (admin.productos) porque el POST a /admin/productos se
// resuelve en esa ruta; acá solo se lee el loader del padre.

export default function AdminProducts() {
  const root = useRouteLoaderData("routes/admin.productos") as { products: Product[] } | undefined;
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
        <TableShell
          headers={["Producto", "Categoría", "Precio", "Disponibilidad", "Estado", "Acciones"]}
        >
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </TableShell>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <TextLink to={`/admin/productos/${product.id}/editar`}>{product.name}</TextLink>
        <p className="text-stone-500">{product.slug}</p>
      </td>
      <td className="px-4 py-3 text-stone-600">{product.category_name ?? "—"}</td>
      <td className="px-4 py-3 font-medium">{formatARS(product.price_cents)}</td>
      <td className="px-4 py-3 text-stone-600">
        {availabilityLabel(
          product.made_to_order === 1
            ? "made_to_order"
            : product.stock > 0
              ? "in_stock"
              : "out_of_stock",
          product.lead_time_days,
        )}
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
