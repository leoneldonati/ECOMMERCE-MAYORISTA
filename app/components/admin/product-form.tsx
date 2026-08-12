import { Form } from "react-router";
import { useRef, useState } from "react";
import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { SelectField, TextareaField, TextField } from "~/components/ui/field";
import { slugify } from "~/lib/slug";

// Formulario de producto (alta/edición). El slug se autogenera desde el nombre
// mientras no se haya editado a mano; las escalas son renglones dinámicos (hasta 6).

export interface ProductFormValues {
  name?: string;
  slug?: string;
  categoryId?: number;
  unitLabel?: string;
  packageSize?: string;
  description?: string;
  stock?: number;
  active?: boolean;
  /** Escalas tal como se editan (minQty y precio en pesos como string). */
  tiers?: { minQty: string; price: string }[];
}

const MAX_TIERS = 6;

export function ProductForm({
  categories,
  action,
  errors = {},
  submitLabel = "Guardar",
  pendingLabel = "Guardando…",
  values,
}: {
  categories: { id: number; name: string }[];
  action: string;
  errors?: Record<string, string>;
  submitLabel?: string;
  pendingLabel?: string;
  values?: ProductFormValues;
}) {
  const initialTiers =
    values?.tiers && values.tiers.length > 0 ? values.tiers : [{ minQty: "1", price: "" }];
  const [tiers, setTiers] = useState(initialTiers);
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugEdited = useRef(false);

  function handleNameInput() {
    if (slugEdited.current || !nameRef.current || !slugRef.current) return;
    slugRef.current.value = slugify(nameRef.current.value);
  }

  function handleSlugInput() {
    slugEdited.current = true;
  }

  function setTier(index: number, field: "minQty" | "price", value: string) {
    setTiers((list) => list.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
  }

  function addTier() {
    setTiers((list) =>
      list.length < MAX_TIERS ? [...list, { minQty: String(Number(list[list.length - 1].minQty || 1) + 1), price: "" }] : list,
    );
  }

  function removeTier(index: number) {
    setTiers((list) => list.filter((_, i) => i !== index));
  }

  return (
    <Form method="post" action={action} className="flex max-w-xl flex-col gap-4">
      <CsrfToken />
      <TextField
        label="Nombre"
        name="name"
        required
        defaultValue={values?.name}
        placeholder="Ej: Arroz largo fino"
        inputRef={nameRef}
        onInput={handleNameInput}
        error={errors.name}
      />
      <TextField
        label="Slug"
        name="slug"
        required
        defaultValue={values?.slug}
        placeholder="arroz-largo-fino"
        inputRef={slugRef}
        onInput={handleSlugInput}
        hint="Se genera desde el nombre; podés ajustarlo a mano."
        error={errors.slug}
      />
      <SelectField label="Categoría" name="categoryId" required defaultValue={values?.categoryId ?? ""} error={errors.categoryId}>
        <option value="">Seleccioná…</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Unidad de venta"
          name="unitLabel"
          required
          defaultValue={values?.unitLabel ?? "caja"}
          hint="Caja, bulto, pack, kilo…"
          error={errors.unitLabel}
        />
        <TextField
          label="Presentación"
          name="packageSize"
          defaultValue={values?.packageSize}
          placeholder="Ej: 24 x 1kg"
          error={errors.packageSize}
        />
      </div>
      <TextareaField
        label="Descripción"
        name="description"
        defaultValue={values?.description}
        rows={2}
        error={errors.description}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Stock"
          name="stock"
          type="number"
          inputMode="numeric"
          min={0}
          required
          defaultValue={values?.stock ?? 0}
          error={errors.stock}
        />
        <label className="flex items-end gap-2 py-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={values?.active ?? true}
            className="h-4 w-4 rounded border-stone-300"
          />
          Activo en el catálogo
        </label>
      </div>

      <fieldset className="rounded-lg border border-stone-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-stone-700">Escalas de precio</legend>
        {errors.tiers ? (
          <p role="alert" className="mb-3 text-xs text-red-600">
            {errors.tiers}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          {tiers.map((tier, index) => (
            <div key={index} className="flex items-end gap-3">
              <TextField
                label={index === 0 ? "Cantidad mínima" : "Mínimo"}
                name={`tier-min-${index}`}
                type="number"
                inputMode="numeric"
                min={1}
                required
                className="w-32"
                value={tier.minQty}
                onChange={(event) => setTier(index, "minQty", event.target.value)}
              />
              <TextField
                label={index === 0 ? "Precio (ARS)" : "Precio"}
                name={`tier-price-${index}`}
                inputMode="decimal"
                required
                className="flex-1"
                placeholder="Ej: 1.200,50"
                value={tier.price}
                onChange={(event) => setTier(index, "price", event.target.value)}
              />
              {tiers.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="mb-0.5 text-sm text-stone-500 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Quitar
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {tiers.length < MAX_TIERS ? (
          <button
            type="button"
            onClick={addTier}
            className="mt-3 text-sm font-medium text-brand-700 hover:underline"
          >
            + Agregar escala
          </button>
        ) : (
          <p className="mt-3 text-xs text-stone-500">Máximo {MAX_TIERS} escalas.</p>
        )}
        <input type="hidden" name="tierCount" value={tiers.length} />
      </fieldset>

      <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
    </Form>
  );
}