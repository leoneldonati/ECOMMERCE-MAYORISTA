import { redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import type { PublicUser } from "~/db/types";
import { getCurrentUser } from "./auth.server";
import { userContext } from "./context.server";

// Middlewares reutilizables para gatear rutas por autenticación.
// Se asignan a `Route.MiddlewareFunction[]` en cada ruta protegida.

interface MiddlewareArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

function redirectToLogin(request: Request): Response {
  const pathname = new URL(request.url).pathname;
  return redirect(`/login?next=${encodeURIComponent(pathname)}`);
}

/**
 * Exige un cliente para comprar (B2C: todos los registrados están habilitados).
 * Sin sesión redirige a /login.
 */
export async function requireUser({ request, context }: MiddlewareArgs): Promise<void> {
  const user = await getCurrentUser(request);
  if (!user) throw redirectToLogin(request);
  context.set(userContext, user);
}

/** Exige rol admin para el panel de administración. */
export async function requireAdmin({ request, context }: MiddlewareArgs): Promise<void> {
  const user = await getCurrentUser(request);
  if (!user) throw redirectToLogin(request);
  if (user.role !== "admin") throw redirect("/");
  context.set(userContext, user);
}

/** Lee el usuario del contexto en loaders/actions de rutas protegidas. */
export function getContextUser(context: Readonly<RouterContextProvider>): PublicUser {
  const user = context.get(userContext);
  if (!user) {
    throw new Error("Ruta protegida sin usuario en el contexto de la request.");
  }
  return user;
}
