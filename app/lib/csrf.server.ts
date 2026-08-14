import { randomBytes, timingSafeEqual } from "node:crypto";
import { createCookie, data } from "react-router";

// Protección CSRF por doble envío: la cookie `impreso_csrf` (httpOnly) y el
// campo oculto `_csrf` del form deben coincidir. Un sitio ajeno no puede leer
// ni escribir la cookie, así que no puede forjar un POST válido.

const CSRF_COOKIE_NAME = "impreso_csrf";
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const csrfCookie = createCookie(CSRF_COOKIE_NAME, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CSRF_MAX_AGE_SECONDS,
});

// Memo por Request: el root loader llama a getCsrfToken varias veces en la misma
// request (para los datos y para el Set-Cookie). Sin memo, la primera visita sin
// cookie generaría tokens distintos entre el form y la cookie → todo POST daba 403.
const tokensByRequest = new WeakMap<Request, string>();

/** Devuelve el token vigente (creado al primer acceso si falta). */
export async function getCsrfToken(request: Request): Promise<string> {
  const cached = tokensByRequest.get(request);
  if (cached) return cached;
  const header = request.headers.get("Cookie");
  let token: string | null = null;
  if (header) {
    const parsed = await csrfCookie.parse(header);
    if (typeof parsed === "string" && parsed.length >= 16) token = parsed;
  }
  const final = token ?? randomBytes(24).toString("hex");
  tokensByRequest.set(request, final);
  return final;
}

/** Set-Cookie para persistir el token actual (refresca el maxAge). */
export async function commitCsrfCookie(request: Request): Promise<string> {
  return csrfCookie.serialize(await getCsrfToken(request));
}

/**
 * Valida el token CSRF de un POST (doble envío). Lanza 403 si no coincide.
 * Debe llamarse ANTES de leer el body del form en el action: clona la request.
 */
export async function requireCsrf(request: Request): Promise<void> {
  const formData = await request.clone().formData();
  const formToken = formData.get("_csrf");
  const cookieToken = await getCsrfToken(request);
  const valid =
    typeof formToken === "string" &&
    typeof cookieToken === "string" &&
    formToken.length === cookieToken.length &&
    timingSafeEqual(Buffer.from(formToken), Buffer.from(cookieToken));
  if (!valid) throw data("Validación de seguridad fallida.", { status: 403 });
}
