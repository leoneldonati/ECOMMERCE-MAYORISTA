import { data } from "react-router";
import type { Route } from "./+types/admin.productos.nuevo";

import { ProductForm, type ProductFormValues } from "~/components/admin/product-form";
import { listCategories } from "~/db/repos/categories.server";
import { createProduct, findProductBySlug, replacePriceTiers } from "~/db/repos/products.server";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { pesosToCents } from "~/lib/money";
import { fieldErrors, productSchema } from "~/lib/validation.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

interface RawForm {
  name: string;
  slug: string;
  categoryId: string;
  unitLabel: string;
  packageSize: string;
  description: string;
  stock: string;
  active: boolean;
}

function buildValues(
  raw: RawForm,
  tierRows: { minQty: string; price: string }[],
): ProductFormValues {
  const stock = Number(raw.stock);
  return {
    ...raw,
    categoryId: raw.categoryId ? Number(raw.categoryId) : undefined,
    stock: Number.isInteger(stock) && stock >= 0 ? stock : undefined,
    tiers: tierRows,
  };
}

export async function loader() {
  return { categories: listCategories() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const get = (name: string) => String(formData.get(name) ?? "");

  const tierCountRaw = Number(formData.get("tierCount"));
  const tierCount = Number.isInteger(tierCountRaw) ? Math.min(Math.max(tierCountRaw, 0), 6) : 0;

  const tierRows: { minQty: string; price: string }[] = [];
  const tiers: { minQty: number; priceCents: number }[] = [];
  for (let i = 0; i < tierCount; i++) {
    const minQty = get(`tier-min-${i}`);
    const price = get(`tier-price-${i}`);
    tierRows.push({ minQty, price });
    tiers.push({ minQty: Number(minQty), priceCents: pesosToCents(price) ?? Number.NaN });
  }

  const raw: RawForm = {
    name: get("name"),
    slug: get("slug"),
    categoryId: get("categoryId"),
    unitLabel: get("unitLabel"),
    packageSize: get("packageSize"),
    description: get("description"),
    stock: get("stock"),
    active: formData.get("active") === "on",
  };

  const parsed = productSchema.safeParse({ ...raw, tiers });
  if (!parsed.success) {
    return data(
      { errors: fieldErrors(parsed.error), values: buildValues(raw, tierRows) },
      { status: 400 },
    );
  }

  const { name, categoryId, slug, unitLabel, packageSize, description, stock, active } =
    parsed.data;
  if (findProductBySlug(slug)) {
    return data(
      { errors: { slug: "El slug ya está en uso." }, values: buildValues(raw, tierRows) },
      { status: 400 },
    );
  }

  const product = createProduct({
    categoryId,
    slug,
    name,
    unitLabel,
    packageSize,
    description,
    stock,
    active,
  });
  replacePriceTiers(
    product.id,
    parsed.data.tiers.map((tier) => ({ minQty: tier.minQty, priceCents: tier.priceCents })),
  );
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
