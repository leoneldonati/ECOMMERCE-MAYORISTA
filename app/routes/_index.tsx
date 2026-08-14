import { Link } from "react-router";
import type { Route } from "./+types/_index";

import { ButtonLink } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Page } from "~/components/ui/page";
import { listCategories } from "~/db/repos/categories.server";

export async function loader({}: Route.LoaderArgs) {
  return { categories: listCategories(true) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Impreso Online — Productos impresos en 3D" },
    {
      name: "description",
      content:
        "Productos impresos en 3D en Argentina: en stock o bajo pedido. Figuras, hogar, accesorios, juegos y útiles, con precios por unidad.",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  return (
    <Page size="xl" pad="comfortable">
      <section className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Productos impresos en <span className="text-brand-700">3D</span>
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Figuras, objetos para el hogar, accesorios y juguetes. En stock o impresos bajo pedido,
          con precios por unidad.
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink to="/productos" size="lg">
            Ver catálogo
          </ButtonLink>
          <ButtonLink to="/registro" variant="secondary" size="lg">
            Crear cuenta
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
        Los productos bajo pedido se imprimen a medida; coordinamos la entrega por WhatsApp o
        Telegram tras confirmar el pago.
      </p>
    </Page>
  );
}
