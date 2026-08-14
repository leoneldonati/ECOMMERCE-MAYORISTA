import type { Route } from "./+types/mi-cuenta";

import { Card } from "~/components/ui/card";
import { Page } from "~/components/ui/page";
import { getContextUser, requireUser } from "~/lib/middleware.server";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export async function loader({ context }: Route.LoaderArgs) {
  return { user: getContextUser(context) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mi cuenta — Impreso Online" }];
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <Page size="md" pad="comfortable">
      <h1 className="mb-2 text-2xl font-bold">{user.name}</h1>

      <Card as="dl" className="grid grid-cols-1 gap-3 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Rol</dt>
          <dd className="font-medium">{user.role === "admin" ? "Administrador" : "Cliente"}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Email</dt>
          <dd>{user.email}</dd>
        </div>
        {user.phone ? (
          <div>
            <dt className="text-stone-500">Teléfono</dt>
            <dd>{user.phone}</dd>
          </div>
        ) : null}
        {user.province ? (
          <div>
            <dt className="text-stone-500">Provincia</dt>
            <dd>{user.province}</dd>
          </div>
        ) : null}
        {user.address ? (
          <div>
            <dt className="text-stone-500">Dirección</dt>
            <dd>{user.address}</dd>
          </div>
        ) : null}
      </Card>
    </Page>
  );
}
