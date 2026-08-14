import type { Route } from "./+types/admin.clientes";

import { EmptyState } from "~/components/ui/empty-state";
import { TableShell } from "~/components/ui/table";
import { formatDate } from "~/lib/dates";
import { listUsers, toPublicUser } from "~/db/repos/users.server";
import type { PublicUser } from "~/db/types";
import { requireAdmin } from "~/lib/middleware.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export async function loader({}: Route.LoaderArgs) {
  return { users: listUsers().map(toPublicUser) };
}

export default function AdminClients({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <div>
      <p className="mb-5 text-sm text-stone-600">{users.length} clientes</p>

      {users.length === 0 ? (
        <EmptyState description="Todavía no hay clientes registrados." />
      ) : (
        <TableShell headers={["Cliente", "Contacto", "Alta"]}>
          {users.map((user) => (
            <ClientRow key={user.id} user={user} />
          ))}
        </TableShell>
      )}
    </div>
  );
}

function ClientRow({ user }: { user: PublicUser }) {
  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <p className="font-medium">{user.name}</p>
        <p className="text-stone-500">{user.email}</p>
      </td>
      <td className="px-4 py-3 text-stone-600">
        <p>{user.phone ?? "—"}</p>
        <p className="text-xs text-stone-400">
          {[user.province, user.address].filter(Boolean).join(" · ") || "Sin dirección"}
        </p>
      </td>
      <td className="px-4 py-3 text-stone-600">{formatDate(user.created_at)}</td>
    </tr>
  );
}
