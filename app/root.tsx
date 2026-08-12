import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/root";
import "./app.css";

import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { ToastProvider, useToast } from "./components/ui/toast";
import { countCartItems } from "./db/repos/cart.server";
import type { PublicUser } from "./db/types";
import { getCurrentUser } from "./lib/auth.server";
import { commitCsrfCookie, getCsrfToken } from "./lib/csrf.server";
import { clearFlash, readFlash } from "./lib/flash.server";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Headers de seguridad básicos en todas las respuestas.
export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    const response = await next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [user, csrf, flash] = await Promise.all([
    getCurrentUser(request),
    getCsrfToken(request),
    readFlash(request),
  ]);
  // El contador del mini-carrito va solo para quien puede comprar (aprobados/admin).
  const canBuy = user !== null && (user.role === "admin" || user.status === "approved");
  const cartCount = canBuy ? countCartItems(user.id) : 0;

  const headers = new Headers();
  headers.append("Set-Cookie", await commitCsrfCookie(request));
  // Si había flash, se lee y se borra en el mismo request para mostrarlo una sola vez.
  if (flash) headers.append("Set-Cookie", await clearFlash());

  return data(
    { user, csrf, cartCount, flash },
    { headers },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#b45309" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const rootData = useRouteLoaderData("root") as
    | { user: PublicUser | null; cartCount: number; flash?: string | undefined }
    | undefined;
  const { toast } = useToast();

  useEffect(() => {
    if (rootData?.flash) toast(rootData.flash);
  }, [rootData?.flash, toast]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <SiteHeader user={rootData?.user ?? null} cartCount={rootData?.cartCount ?? 0} />
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Algo salió mal.";
  let details = "Ocurrió un error inesperado. Probá de nuevo en unos minutos.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Página no encontrada" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "La página que buscás no existe o fue movida."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <p className="mb-2 text-sm font-bold tracking-tight text-brand-700">
        Despensa<span className="text-stone-900">Online</span>
      </p>
      <h1 className="text-3xl font-bold">{message}</h1>
      <p className="mt-2 max-w-md text-stone-600">{details}</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-brand-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-800"
      >
        Volver al inicio
      </Link>
      {stack && (
        <pre className="mt-8 w-full max-w-2xl overflow-x-auto rounded-lg bg-stone-900 p-4 text-left text-xs text-stone-100">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}