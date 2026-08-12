import type { Route } from "./+types/mi-cuenta";

import { getContextUser, requireUser } from "~/lib/middleware.server";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de aprobación",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  revendedor: "Revendedor",
  almacen: "Almacén / autoservicio",
  distribuidor: "Distribuidor",
  otro: "Otro",
};

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export async function loader({ context }: Route.LoaderArgs) {
  return { user: getContextUser(context) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mi cuenta — Despensa Online" }];
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">{user.business_name}</h1>

      {user.status === "pending" ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tu cuenta está <strong>en revisión</strong>. Cuando un administrador la
          apruebe vas a poder ver precios y realizar pedidos.
        </div>
      ) : null}
      {user.status === "rejected" ? (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Tu cuenta fue <strong>rechazada</strong>. Si pensás que es un error,
          comunicate con nosotros para revisar el caso.
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Estado</dt>
          <dd className="font-medium">{STATUS_LABEL[user.status] ?? user.status}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Rol</dt>
          <dd className="font-medium">
            {user.role === "admin" ? "Administrador" : "Cliente"}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt className="text-stone-500">CUIT</dt>
          <dd>{user.cuit}</dd>
        </div>
        {user.contact_name ? (
          <div>
            <dt className="text-stone-500">Contacto</dt>
            <dd>{user.contact_name}</dd>
          </div>
        ) : null}
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
        {user.customer_type ? (
          <div>
            <dt className="text-stone-500">Tipo de cliente</dt>
            <dd>{CUSTOMER_TYPE_LABEL[user.customer_type] ?? user.customer_type}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}