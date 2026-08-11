import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/login";

import { CsrfToken } from "~/components/csrf-token";
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
  const target =
    user.status === "pending"
      ? "/mi-cuenta"
      : next && next.startsWith("/")
        ? next
        : "/";
  return redirect(target, { headers: { "Set-Cookie": cookie } });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Ingresar — MayoristaAR" }];
}

export default function Login({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors;
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Ingresar</h1>
      {errors?._form ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors._form}</p>
      ) : null}
      <Form method="post" className="flex flex-col gap-4">
        <CsrfToken />
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-stone-300 px-3 py-2 text-base"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          Ingresar
        </button>
      </Form>
      <p className="mt-6 text-sm text-stone-600">
        ¿No tenés cuenta?{" "}
        <a href="/registro" className="font-medium text-amber-700 hover:underline">
          Solicitá tu cuenta mayorista
        </a>
      </p>
    </div>
  );
}