import { createCookie, redirect } from "react-router";

// Flash entre actions y cargas: un mensaje que se muestra UNA vez como toast.
// Se guarda en una cookie efímera (60s) que el root loader lee y borra en el
// primer request, así no resucita con un refresh ni con navegaciones normales.

const flashCookie = createCookie("despensa_flash", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60,
});

/** Valor de Set-Cookie con el mensaje de flash. */
export async function setFlash(message: string): Promise<string> {
  return flashCookie.serialize(message);
}

/** Lee el mensaje de flash (si lo hay). Llamar en el root loader. */
export async function readFlash(request: Request): Promise<string | undefined> {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  const parsed = await flashCookie.parse(header);
  return typeof parsed === "string" && parsed.length > 0 ? parsed : undefined;
}

/** Set-Cookie que invalida la cookie de flash (se manda junto con el flash leído). */
export async function clearFlash(): Promise<string> {
  return flashCookie.serialize("", { expires: new Date(0) });
}

/**
 * Redirect con flash. `cookies` son Set-Cookies adicionales a incluir (por ej.
 * la de sesión en registro): se fusionan para no pisarse entre sí.
 */
export async function redirectWithFlash(
  target: string,
  message: string,
  cookies: string | string[] = [],
): Promise<Response> {
  const headers = new Headers();
  for (const cookie of Array.isArray(cookies) ? cookies : [cookies]) {
    headers.append("Set-Cookie", cookie);
  }
  headers.append("Set-Cookie", await setFlash(message));
  return redirect(target, { headers });
}
