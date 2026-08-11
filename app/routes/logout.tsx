import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/logout";

import { CsrfToken } from "~/components/csrf-token";
import { destroySessionCookie, getSessionToken } from "~/lib/auth.server";
import { requireCsrf } from "~/lib/csrf.server";
import { deleteSession } from "~/db/repos/sessions.server";

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const token = await getSessionToken(request);
  if (token) deleteSession(token);
  return redirect("/", { headers: { "Set-Cookie": await destroySessionCookie() } });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cerrar sesión — MayoristaAR" }];
}

export default function Logout() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold">Cerrar sesión</h1>
      <p className="mb-6 text-stone-600">¿Querés cerrar tu sesión?</p>
      <Form method="post" className="flex items-center gap-3">
        <CsrfToken />
        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          Sí, cerrar sesión
        </button>
        <Link to="/" className="font-medium text-stone-600 hover:underline">
          Volver
        </Link>
      </Form>
    </div>
  );
}