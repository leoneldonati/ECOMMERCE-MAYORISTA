import { data, Link } from "react-router";
import type { Route } from "./+types/admin.productos.$id.editar";

import { ProductForm, type ProductFormValues } from "~/components/admin/product-form";
import { listCategories } from "~/db/repos/categories.server";
import {
  findProductById,
  findProductBySlug,
  listTiersForProduct,
  replacePriceTiers,
  updateProduct,
} from "~/db/repos/products.server";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { centsToPesosInput, pesosToCents } from "~/lib/money";
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

export async function loader({ params }: Route.LoaderArgs) {
  const productId = Number(params.id);
  if (!Number.isInteger(productId)) throw data(null, { status: 404 });

  const product = findProductById(productId);
  if (!product) throw data(null, { status: 404 });

  const tiers = listTiersForProduct(productId);
  return {
    productId: product.id,
    categories: listCategories(),
    product: {
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      unitLabel: product.unit_label,
      packageSize: product.package_size ?? "",
      description: product.description ?? "",
      stock: product.stock,
      active: product.active === 1,
      tiers: tiers.map((tier) => ({
        minQty: String(tier.min_qty),
        price: centsToPesosInput(tier.price_cents),
      })),
    } satisfies ProductFormValues,
  };
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
  const conflict = findProductBySlug(slug);
  if (conflict && conflict.id !== productId) {
    return data(
      {
        errors: { slug: "El slug ya está en uso por otro producto." },
        values: buildValues(raw, tierRows),
      },
      { status: 400 },
    );
  }

  updateProduct(productId, {
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
    productId,
    parsed.data.tiers.map((tier) => ({ minQty: tier.minQty, priceCents: tier.priceCents })),
  );
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
