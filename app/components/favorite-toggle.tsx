import { useFetcher } from "react-router";
import { Heart } from "lucide-react";
import { CsrfToken } from "./csrf-token";

// Botón corazón para alternar favoritos (POST a /favoritos). Optimista: refleja
// el estado que devuelve la action mientras el loader revalida, y se deshabilita
// mientras carga. Solo se renderiza a usuarios logueados.

export function FavoriteToggle({
  productId,
  favorited,
  loggedIn,
  className,
}: {
  productId: number;
  favorited: boolean;
  loggedIn: boolean;
  className?: string;
}) {
  const fetcher = useFetcher<{ ok?: boolean; favorited?: boolean }>();
  const pending = fetcher.state !== "idle";
  const isFav = fetcher.data?.favorited ?? favorited;

  if (!loggedIn) return null;

  return (
    <fetcher.Form method="post" action="/favoritos" className={`inline-block ${className ?? ""}`}>
      <input type="hidden" name="intent" value="toggle" />
      <input type="hidden" name="productId" value={productId} />
      <CsrfToken />
      <button
        type="submit"
        disabled={pending}
        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        aria-pressed={isFav}
        className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-brand-700 disabled:opacity-50"
      >
        <Heart
          className={`h-5 w-5 ${isFav ? "fill-brand-700 text-brand-700" : ""}`}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>
    </fetcher.Form>
  );
}
