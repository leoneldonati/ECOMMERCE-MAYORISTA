import { data, Link } from "react-router";
import type { Route } from "./+types/admin.productos.$id.editar";

import { ProductForm, type ProductFormValues } from "~/components/admin/product-form";
import { listCategories } from "~/db/repos/categories.server";
import { findProductById, findProductBySlug, updateProduct } from "~/db/repos/products.server";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { centsToPesosInput, pesosToCents } from "~/lib/money";
import { fieldErrors, productSchema } from "~/lib/validation.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

function toFormValues(product: Awaited<ReturnType<typeof findProductById>>): ProductFormValues {
  return {
    name: product?.name,
    slug: product?.slug,
    categoryId: product?.category_id,
    description: product?.description ?? "",
    price: product ? centsToPesosInput(product.price_cents) : undefined,
    imageUrl: product?.image_url ?? "",
    stock: product?.stock,
    leadTimeDays: product?.lead_time_days ?? undefined,
    madeToOrder: product?.made_to_order === 1,
    active: product?.active === 1,
  };
}

export async function loader({ params }: Route.LoaderArgs) {
  const productId = Number(params.id);
  if (!Number.isInteger(productId)) throw data(null, { status: 404 });

  const product = findProductById(productId);
  if (!product) throw data(null, { status: 404 });

  return { productId: product.id, categories: listCategories(), product: toFormValues(product) };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireCsrf(request);
  const productId = Number(params.id);
  if (!Number.isInteger(productId))
    return data({ errors: { _form: "Producto inválido." } }, { status: 400 });

  const existing = findProductById(productId);
  if (!existing) return data({ errors: { _form: "El producto no existe." } }, { status: 404 });

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
  const conflict = findProductBySlug(slug);
  if (conflict && conflict.id !== productId) {
    return data(
      { errors: { slug: "El slug ya está en uso por otro producto." }, values },
      { status: 400 },
    );
  }

  updateProduct(productId, {
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
  return redirectWithFlash("/admin/productos", `"${name}" fue actualizado.`);
}

export default function EditProduct({ loaderData, actionData }: Route.ComponentProps) {
  const { categories, product, productId } = loaderData;
  const feedback = actionData as
    { errors?: Record<string, string>; values?: ProductFormValues } | undefined;

  return (
    <div>
      <nav className="mb-4 text-sm text-stone-500">
        <Link to="/admin/productos" className="transition-colors hover:text-brand-700">
          Productos
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>
      <h2 className="mb-6 text-lg font-semibold">Editar producto</h2>
      <ProductForm
        categories={categories}
        action={`/admin/productos/${productId}/editar`}
        values={feedback?.values ?? product}
        errors={feedback?.errors}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando…"
      />
    </div>
  );
}
