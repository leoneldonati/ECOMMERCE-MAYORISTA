import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/registro";

import { CsrfToken } from "~/components/csrf-token";
import { createLoginCookie, getCurrentUser } from "~/lib/auth.server";
import { requireCsrf } from "~/lib/csrf.server";
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
  return redirect("/mi-cuenta", { headers: { "Set-Cookie": cookie } });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Solicitar cuenta — MayoristaAR" }];
}

export default function Register({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors as Record<string, string> | undefined;
  const field = (name: string) =>
    errors?.[name] ? <p className="text-xs text-red-600">{errors[name]}</p> : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">Solicitar cuenta mayorista</h1>
      <p className="mb-6 text-sm text-stone-600">
        Tu cuenta queda en revisión y la habilita un administrador antes de poder comprar.
      </p>
      <Form method="post" className="flex flex-col gap-4">
        <CsrfToken />
        <label className="flex flex-col gap-1 text-sm">
          Razón social
          <input
            type="text"
            name="businessName"
            required
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
          {field("businessName")}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          CUIT
          <input
            type="text"
            name="cuit"
            inputMode="numeric"
            required
            placeholder="20-12345678-9"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
          {field("cuit")}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
          {field("email")}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
          {field("password")}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Persona de contacto
          <input
            type="text"
            name="contactName"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <input
            type="tel"
            name="phone"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Provincia
          <input
            type="text"
            name="province"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo de cliente
          <select name="customerType" className="rounded-md border border-stone-300 px-3 py-2 text-base">
            <option value="">Seleccioná...</option>
            {CUSTOMER_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          Solicitar cuenta
        </button>
      </Form>
    </div>
  );
}