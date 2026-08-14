import { data } from "react-router";
import type { Route } from "./+types/admin.productos.nuevo";

import { ProductForm, type ProductFormValues } from "~/components/admin/product-form";
import { listCategories } from "~/db/repos/categories.server";
import { createProduct, findProductBySlug } from "~/db/repos/products.server";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { pesosToCents } from "~/lib/money";
import { fieldErrors, productSchema } from "~/lib/validation.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export async function loader() {
  return { categories: listCategories() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const get = (name: string) => String(formData.get(name) ?? "");

  const raw = {
    name: get("name"),
    slug: get("slug"),
    categoryId: get("categoryId"),
    description: get("description"),
    price: get("price"),
    imageUrl: get("imageUrl"),
    stock: get("stock"),
    leadTimeDays: get("leadTimeDays"),
    madeToOrder: formData.get("madeToOrder") === "on",
    active: formData.get("active") === "on",
  };

  const priceCents = pesosToCents(raw.price) ?? Number.NaN;
  const parsed = productSchema.safeParse({
    name: raw.name,
    slug: raw.slug,
    categoryId: raw.categoryId,
    description: raw.description,
    priceCents,
    imageUrl: raw.imageUrl || null,
    stock: raw.stock,
    leadTimeDays: raw.leadTimeDays || null,
    madeToOrder: raw.madeToOrder,
    active: raw.active,
  });

  const values: ProductFormValues = {
    name: raw.name || undefined,
    slug: raw.slug || undefined,
    categoryId: raw.categoryId ? Number(raw.categoryId) : undefined,
    description: raw.description || undefined,
    price: raw.price || undefined,
    imageUrl: raw.imageUrl || undefined,
    stock: raw.stock ? Number(raw.stock) : undefined,
    leadTimeDays: raw.leadTimeDays ? Number(raw.leadTimeDays) : undefined,
    madeToOrder: raw.madeToOrder,
    active: raw.active,
  };

  if (!parsed.success) {
    return data({ errors: fieldErrors(parsed.error), values }, { status: 400 });
  }

  const {
    name,
    categoryId,
    slug,
    description,
    stock,
    imageUrl,
    leadTimeDays,
    madeToOrder,
    active,
  } = parsed.data;
  if (findProductBySlug(slug)) {
    return data({ errors: { slug: "El slug ya está en uso." }, values }, { status: 400 });
  }

  createProduct({
    categoryId,
    slug,
    name,
    description,
    priceCents: parsed.data.priceCents,
    imageUrl,
    stock,
    leadTimeDays,
    madeToOrder,
    active,
  });
  return redirectWithFlash("/admin/productos", `"${name}" fue creado.`);
}

export default function NewProduct({ loaderData, actionData }: Route.ComponentProps) {
  const { categories } = loaderData;
  const feedback = actionData as
    { errors?: Record<string, string>; values?: ProductFormValues } | undefined;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Nuevo producto</h2>
      <ProductForm
        categories={categories}
        action="/admin/productos/nuevo"
        values={feedback?.values}
        errors={feedback?.errors}
        submitLabel="Crear producto"
        pendingLabel="Creando…"
      />
    </div>
  );
}
