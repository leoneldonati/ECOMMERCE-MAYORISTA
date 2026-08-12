import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/registro";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { SelectField, TextField } from "~/components/ui/field";
import { createLoginCookie, getCurrentUser } from "~/lib/auth.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { fieldErrors, registerSchema } from "~/lib/validation.server";
import { createUser, findUserByEmail } from "~/db/repos/users.server";
import { hashPassword } from "~/lib/password.server";

const CUSTOMER_TYPES = [
  { value: "revendedor", label: "Revendedor" },
  { value: "almacen", label: "Almacén / autoservicio" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "otro", label: "Otro" },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  if (user) return redirect("/mi-cuenta");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
    cuit: formData.get("cuit"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    province: formData.get("province"),
    customerType: formData.get("customerType") || undefined,
  });
  if (!parsed.success) {
    return data({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  if (findUserByEmail(input.email)) {
    return data({ errors: { email: "Ya existe una cuenta con ese email." } }, { status: 400 });
  }

  let user;
  try {
    user = createUser({
      email: input.email,
      passwordHash: hashPassword(input.password),
      businessName: input.businessName,
      cuit: input.cuit,
      contactName: input.contactName,
      phone: input.phone,
      province: input.province,
      customerType: input.customerType,
    });
  } catch (error) {
    // La única UNIQUE restante es cuit (email ya validado): mapear como error de campo.
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return data({ errors: { cuit: "Ya existe una cuenta con ese CUIT." } }, { status: 400 });
    }
    throw error;
  }

  const cookie = await createLoginCookie(user.id);
  return redirectWithFlash("/mi-cuenta", "Cuenta creada. Queda en revisión.", cookie);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Solicitar cuenta — Despensa Online" }];
}

export default function Register({ actionData }: Route.ComponentProps) {
  const errors = (actionData?.errors as Record<string, string> | undefined) ?? {};

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">Solicitar cuenta mayorista</h1>
      <p className="mb-6 text-sm text-stone-600">
        Tu cuenta queda en revisión y la habilita un administrador antes de poder comprar.
      </p>
      {errors._form ? (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors._form}
        </p>
      ) : null}
      <Form method="post" className="flex flex-col gap-4">
        <CsrfToken />
        <TextField
          label="Razón social"
          name="businessName"
          required
          error={errors.businessName}
        />
        <TextField
          label="CUIT"
          name="cuit"
          inputMode="numeric"
          required
          placeholder="20-12345678-9"
          error={errors.cuit}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={errors.email}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          error={errors.password}
        />
        <TextField label="Persona de contacto" name="contactName" error={errors.contactName} />
        <TextField label="Teléfono" name="phone" type="tel" error={errors.phone} />
        <TextField label="Provincia" name="province" error={errors.province} />
        <SelectField label="Tipo de cliente" name="customerType" error={errors.customerType}>
          <option value="">Seleccioná...</option>
          {CUSTOMER_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SubmitButton pendingLabel="Enviando…">Solicitar cuenta</SubmitButton>
      </Form>
    </div>
  );
}