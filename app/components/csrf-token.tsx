import { useRouteLoaderData } from "react-router";

// Campo oculto con el token CSRF para los forms POST. Lo provee el root loader
// (leído de la cookie httpOnly), así que el navegador nunca lo inventa.
export function CsrfToken() {
  const root = useRouteLoaderData("root") as { csrf: string } | undefined;
  return <input type="hidden" name="_csrf" value={root?.csrf ?? ""} />;
}