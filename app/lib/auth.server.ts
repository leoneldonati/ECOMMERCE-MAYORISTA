import { createCookie } from "react-router";
import { createSession, findSessionUser } from "~/db/repos/sessions.server";
import { toPublicUser } from "~/db/repos/users.server";
import type { PublicUser } from "~/db/types";

// Sesión por token opaco: la cookie solo transporta un token aleatorio que se
// resuelve contra la tabla `sessions` en cada request. Así el estado y rol del
// usuario siempre son los vigentes y el admin puede revocar sesiones.

const SESSION_COOKIE_NAME = "mayorista_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

const sessionCookie = createCookie(SESSION_COOKIE_NAME, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
});

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export async function getSessionToken(request: Request): Promise<string | undefined> {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  const parsed = await sessionCookie.parse(header);
  return typeof parsed === "string" && parsed.length > 0 ? parsed : undefined;
}

/** Usuario autenticado (sin password_hash) o null según la sesión vigente. */
export async function getCurrentUser(request: Request): Promise<PublicUser | null> {
  const token = await getSessionToken(request);
  if (!token) return null;
  const user = findSessionUser(token);
  return user ? toPublicUser(user) : null;
}

/** Crea la sesión en DB y devuelve el valor de Set-Cookie para iniciar sesión. */
export async function createLoginCookie(userId: number): Promise<string> {
  const token = createSession(userId);
  return sessionCookie.serialize(token);
}

/** Valor de Set-Cookie que invalida la cookie de sesión (logout). */
export async function destroySessionCookie(): Promise<string> {
  return sessionCookie.serialize("", { expires: new Date(0) });
}