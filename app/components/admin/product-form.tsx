import { Form } from "react-router";
import { useRef, useState } from "react";
import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { SelectField, TextareaField, TextField } from "~/components/ui/field";
import { slugify } from "~/lib/slug";

// Formulario de producto (alta/edición) con precio único. El slug se
// autogenera desde el nombre mientras no se haya editado a mano.

export interface ProductFormValues {
  name?: string;
  slug?: string;
  categoryId?: number;
  description?: string;
  /** Precio en pesos como lo escribe el admin (el schema lo convierte a centavos). */
  price?: string;
  imageUrl?: string;
  stock?: number;
  leadTimeDays?: number;
  madeToOrder?: boolean;
  active?: boolean;
}

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
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugEdited = useRef(false);
  const [madeToOrder, setMadeToOrder] = useState(values?.madeToOrder ?? false);

  function handleNameInput() {
    if (slugEdited.current || !nameRef.current || !slugRef.current) return;
    slugRef.current.value = slugify(nameRef.current.value);
  }

  function handleSlugInput() {
    slugEdited.current = true;
  }

  return (
    <Form method="post" action={action} className="flex max-w-xl flex-col gap-4">
      <CsrfToken />
      <TextField
        label="Nombre"
        name="name"
        required
        defaultValue={values?.name}
        placeholder="Ej: Figurita de dinosaurio"
        inputRef={nameRef}
        onInput={handleNameInput}
        error={errors.name}
      />
      <TextField
        label="Slug"
        name="slug"
        required
        defaultValue={values?.slug}
        placeholder="figurita-dinosaurio"
        inputRef={slugRef}
        onInput={handleSlugInput}
        hint="Se genera desde el nombre; podés ajustarlo a mano."
        error={errors.slug}
      />
      <SelectField
        label="Categoría"
        name="categoryId"
        required
        defaultValue={values?.categoryId ?? ""}
        error={errors.categoryId}
      >
        <option value="">Seleccioná…</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Precio (ARS)"
        name="price"
        inputMode="decimal"
        required
        defaultValue={values?.price}
        placeholder="Ej: 1.200,50"
        error={errors.priceCents ?? errors.price}
      />
      <TextField
        label="URL de la imagen"
        name="imageUrl"
        defaultValue={values?.imageUrl}
        placeholder="https://…"
        error={errors.imageUrl}
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
        <TextField
          label="Días de producción (bajo pedido)"
          name="leadTimeDays"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={values?.leadTimeDays ?? ""}
          error={errors.leadTimeDays}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="madeToOrder"
          checked={madeToOrder}
          onChange={(event) => setMadeToOrder(event.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Impresión bajo pedido (sin tope de stock)
      </label>
      <TextareaField
        label="Descripción"
        name="description"
        defaultValue={values?.description}
        rows={2}
        error={errors.description}
      />
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={values?.active ?? true}
          className="h-4 w-4 rounded border-stone-300"
        />
        Activo en el catálogo
      </label>

      <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
    </Form>
  );
}
