import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/registro";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { TextField } from "~/components/ui/field";
import { Page } from "~/components/ui/page";
import { createLoginCookie, getCurrentUser } from "~/lib/auth.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";
import { fieldErrors, registerSchema } from "~/lib/validation.server";
import { createUser, findUserByEmail } from "~/db/repos/users.server";
import { hashPassword } from "~/lib/password.server";

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
    name: formData.get("name"),
    phone: formData.get("phone"),
    province: formData.get("province"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return data({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  if (findUserByEmail(input.email)) {
    return data({ errors: { email: "Ya existe una cuenta con ese email." } }, { status: 400 });
  }

  const user = createUser({
    email: input.email,
    passwordHash: hashPassword(input.password),
    name: input.name,
    phone: input.phone,
    province: input.province,
    address: input.address,
  });

  const cookie = await createLoginCookie(user.id);
  return redirectWithFlash("/", "Cuenta creada. ¡Ya podés comprar!", cookie);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Crear cuenta — Impreso Online" }];
}

export default function Register({ actionData }: Route.ComponentProps) {
  const errors = (actionData?.errors as Record<string, string> | undefined) ?? {};

  return (
    <Page size="sm" pad="comfortable">
      <h1 className="mb-2 text-2xl font-bold">Crear cuenta</h1>
      <p className="mb-6 text-sm text-stone-600">
        Registrate para armar tu pedido y comprar productos impresos en 3D.
      </p>
      <FormError className="mb-4">{errors._form}</FormError>
      <Form method="post" className="flex flex-col gap-4">
        <CsrfToken />
        <TextField label="Nombre" name="name" required autoComplete="name" error={errors.name} />
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
        <TextField
          label="Teléfono"
          name="phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
        />
        <TextField label="Provincia" name="province" error={errors.province} />
        <TextField
          label="Dirección"
          name="address"
          autoComplete="street-address"
          error={errors.address}
        />
        <SubmitButton pendingLabel="Enviando…">Crear cuenta</SubmitButton>
      </Form>
    </Page>
  );
}
