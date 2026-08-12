import { Link } from "react-router";
import type { CatalogItem } from "~/lib/catalog.server";
import { formatARS } from "~/lib/money";
import { PricesNotice, type PricesNoticeStatus } from "./prices-notice";

export function ProductCard({
  item,
  pricesNotice,
}: {
  item: CatalogItem;
  pricesNotice: PricesNoticeStatus | null;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <h2 className="font-medium">
        <Link to={`/productos/${item.slug}`} className="hover:text-brand-700">
          {item.name}
        </Link>
      </h2>
      <p className="mt-0.5 text-sm text-stone-500">
        {item.package_size} · {item.unit_label}
      </p>
      {item.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-stone-600">{item.description}</p>
      ) : null}

      <div className="mt-auto pt-4">
        {item.from_price_cents !== null ? (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-stone-500">Desde</span>
            <span className="text-lg font-semibold text-stone-900">
              {formatARS(item.from_price_cents)}
            </span>
          </div>
        ) : pricesNotice ? (
          <PricesNotice status={pricesNotice} variant="card" />
        ) : null}
      </div>
    </article>
  );
}