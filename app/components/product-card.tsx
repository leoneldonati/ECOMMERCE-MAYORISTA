import { Link } from "react-router";
import type { CatalogItem } from "~/lib/catalog.server";
import { availabilityLabel } from "~/lib/availability";
import { formatARS } from "~/lib/money";
import { FavoriteToggle } from "./favorite-toggle";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function ProductCard({
  item,
  favorited = false,
  loggedIn = false,
}: {
  item: CatalogItem;
  favorited?: boolean;
  loggedIn?: boolean;
}) {
  const stockClass =
    item.availability === "in_stock"
      ? "success"
      : item.availability === "made_to_order"
        ? "info"
        : "warning";

  return (
    <Card as="article" className="relative flex flex-col p-4 transition-shadow hover:shadow-sm">
      <FavoriteToggle
        productId={item.id}
        favorited={favorited}
        loggedIn={loggedIn}
        className="absolute right-2 top-2"
      />
      <Link to={`/productos/${item.slug}`} className="block">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="mb-3 aspect-square w-full rounded-lg bg-stone-100 object-cover"
          />
        ) : null}
        <h2 className="font-medium hover:text-brand-700">{item.name}</h2>
      </Link>
      {item.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{item.description}</p>
      ) : null}

      <div className="mt-auto pt-4">
        <Badge tone={stockClass}>{availabilityLabel(item.availability, item.lead_time_days)}</Badge>
        <div className="mt-2 text-lg font-semibold text-stone-900">
          {formatARS(item.price_cents)}
        </div>
      </div>
    </Card>
  );
}
