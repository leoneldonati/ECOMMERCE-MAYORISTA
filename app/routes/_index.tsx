import { Link } from "react-router";
import type { Route } from "./+types/_index";

import { ButtonLink } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { listCategories } from "~/db/repos/categories.server";

export async function loader({}: Route.LoaderArgs) {
  return { categories: listCategories(true) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Despensa Online — Alimentos no perecederos por mayor" },
    {
      name: "description",
      content:
        "Compra mayorista de alimentos no perecederos en Argentina. Precios por escalas de cantidad, atención a revendedores, almacenes y distribuidores.",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Alimentos no perecederos <span className="text-brand-700">por mayor</span>
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Precios por escalas de cantidad, pedido mínimo de $ 10.000 y atención a revendedores,
          almacenes y distribuidores de todo el país.
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink to="/productos" size="lg">
            Ver catálogo
          </ButtonLink>
          <ButtonLink to="/registro" variant="secondary" size="lg">
            Solicitar cuenta
          </ButtonLink>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-4 text-xl font-semibold">Categorías</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/productos?categoria=${category.slug}`}
              className="block"
            >
              <Card className="h-full p-4 transition-colors hover:border-brand-300">
                <h3 className="font-medium">{category.name}</h3>
                {category.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{category.description}</p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-16 text-sm text-stone-400">
        Los precios mayoristas se muestran a los clientes con cuenta aprobada.
      </p>
    </div>
  );
}
