import { Outlet } from "react-router";
import type { Route } from "./+types/admin.productos";

import { FormError } from "~/components/ui/form-error";
import { errorResponse } from "~/lib/action-utils.server";
import {
  deleteProduct,
  findProductById,
  listProducts,
  updateProduct,
} from "~/db/repos/products.server";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";

// Layout de /admin/productos: el listado vive en admin.productos._index, el
// alta en admin.productos.nuevo y la edición en admin.productos.$id.editar.
// El loader (productos para el listado) y el action (activar/eliminar) viven
// acá porque React Router resuelve el POST a /admin/productos en esta ruta.

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export async function loader({}: Route.LoaderArgs) {
  return { products: listProducts() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const productId = Number(formData.get("productId"));

  if (!Number.isInteger(productId) || productId <= 0)
    return errorResponse("Producto inválido.", 400);
  const product = findProductById(productId);
  if (!product) return errorResponse("El producto no existe.", 404);

  if (intent === "toggle") {
    const active = product.active === 1 ? false : true;
    updateProduct(productId, { active });
    return redirectWithFlash(
      "/admin/productos",
      active ? `"${product.name}" está activo.` : `"${product.name}" quedó inactivo.`,
    );
  }

  if (intent === "delete") {
    try {
      deleteProduct(productId);
    } catch {
      // La FK de order_items protege el borrado: no se puede perder el historial.
      return errorResponse(`No se puede eliminar "${product.name}": tiene pedidos asociados.`);
    }
    return redirectWithFlash("/admin/productos", `"${product.name}" fue eliminado.`);
  }

  return errorResponse("Acción desconocida.", 400);
}

export default function AdminProductosLayout({ actionData }: Route.ComponentProps) {
  const errors = (actionData as { errors?: Record<string, string> } | undefined)?.errors;
  return (
    <>
      <FormError className="mb-4">{errors?._form}</FormError>
      <Outlet />
    </>
  );
}
