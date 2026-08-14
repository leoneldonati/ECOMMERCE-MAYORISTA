import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/login";

import { CsrfToken } from "~/components/csrf-token";
import { SubmitButton } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { TextField } from "~/components/ui/field";
import { Page } from "~/components/ui/page";
import { TextLink } from "~/components/ui/text-link";
import { createLoginCookie, getCurrentUser } from "~/lib/auth.server";
import { requireCsrf } from "~/lib/csrf.server";
import {
  getClientIp,
  getLock,
  registerLoginFailure,
  registerLoginSuccess,
} from "~/lib/rate-limit.server";
import { fieldErrors, loginSchema } from "~/lib/validation.server";
import { findUserByEmail } from "~/db/repos/users.server";
import { verifyPassword } from "~/lib/password.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  if (user) return redirect(user.status === "pending" ? "/mi-cuenta" : "/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return data({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(request);
  const lock = getLock({ ip, email });
  if (lock.locked) {
    return data(
      {
        errors: {
          _form: `Demasiados intentos. Probá de nuevo en ${lock.remainingSeconds} segundos.`,
        },
      },
      { status: 429 },
    );
  }

  const user = findUserByEmail(email);
  const valid = user !== undefined && verifyPassword(password, user.password_hash);
  if (!valid) {
    registerLoginFailure(ip, email);
    return data({ errors: { _form: "Email o contraseña incorrectos." } }, { status: 400 });
  }
  registerLoginSuccess(ip, email);

  const cookie = await createLoginCookie(user.id);
  const next = new URL(request.url).searchParams.get("next");
  const target = next && next.startsWith("/") ? next : "/";
  return redirect(target, { headers: { "Set-Cookie": cookie } });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Ingresar — Impreso Online" }];
}

export default function Login({ actionData }: Route.ComponentProps) {
  const errors = (actionData?.errors ?? {}) as Record<string, string>;
  return (
    <Page size="sm" pad="comfortable" className="flex flex-col">
      <h1 className="mb-2 text-2xl font-bold">Ingresar</h1>
      <p className="mb-6 text-sm text-stone-600">Entrá con el email de tu cuenta.</p>
      <FormError className="mb-4">{errors._form}</FormError>
      <Form method="post" className="flex flex-col gap-4">
        <CsrfToken />
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
          autoComplete="current-password"
          error={errors.password}
        />
        <SubmitButton pendingLabel="Ingresando…">Ingresar</SubmitButton>
      </Form>
      <p className="mt-6 text-sm text-stone-600">
        ¿No tenés cuenta? <TextLink to="/registro">Crear una cuenta</TextLink>
      </p>
    </Page>
  );
}
