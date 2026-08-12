import { Form, Link } from "react-router";
import type { Route } from "./+types/admin.clientes";

import { ConfirmButton } from "~/components/confirm-button";
import { CsrfToken } from "~/components/csrf-token";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { FormError } from "~/components/ui/form-error";
import { TableShell } from "~/components/ui/table";
import { errorResponse } from "~/lib/action-utils.server";
import { formatCuit } from "~/lib/cuit";
import { formatDate } from "~/lib/dates";
import { findUserById, listUsers, setUserStatus, toPublicUser } from "~/db/repos/users.server";
import type { PublicUser, UserStatus } from "~/db/types";
import { requireAdmin } from "~/lib/middleware.server";
import { requireCsrf } from "~/lib/csrf.server";
import { redirectWithFlash } from "~/lib/flash.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

const STATUS_BADGE_TONE: Record<UserStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export async function loader({ request }: Route.LoaderArgs) {
  const estado = new URL(request.url).searchParams.get("estado");
  const onlyPending = estado === "pending";
  const users = listUsers(onlyPending ? "pending" : undefined).map(toPublicUser);
  return { users, onlyPending, pendingCount: listUsers("pending").length };
}

export async function action({ request }: Route.ActionArgs) {
  await requireCsrf(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const userId = Number(formData.get("userId"));

  if (intent === "approve-all") {
    const pending = listUsers("pending");
    for (const user of pending) setUserStatus(user.id, "approved");
    if (pending.length === 0) return errorResponse("No hay cuentas pendientes.", 400);
    return redirectWithFlash(
      "/admin/clientes",
      `Se aprobaron ${pending.length} cuenta${pending.length === 1 ? "" : "s"}.`,
    );
  }

  if (intent === "approve" || intent === "reject") {
    if (!Number.isInteger(userId) || userId <= 0) return errorResponse("Usuario inválido.", 400);
    const user = findUserById(userId);
    if (!user || user.role === "admin") return errorResponse("Usuario inválido.", 400);
    const okay = user.status !== "approved" || intent === "reject";
    if (!okay) return errorResponse("La cuenta ya está aprobada.", 400);

    setUserStatus(userId, intent === "approve" ? "approved" : "rejected");
    return redirectWithFlash(
      "/admin/clientes",
      intent === "approve"
        ? `${user.business_name}: cuenta aprobada.`
        : `${user.business_name}: cuenta rechazada.`,
    );
  }

  return errorResponse("Acción desconocida.", 400);
}

function ActionForm({
  intent,
  userId,
  children,
}: {
  intent: "approve" | "reject";
  userId: number;
  children: React.ReactNode;
}) {
  return (
    <Form method="post" className="inline-block">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="userId" value={userId} />
      <CsrfToken />
      {children}
    </Form>
  );
}

export default function AdminClients({ loaderData, actionData }: Route.ComponentProps) {
  const { users, onlyPending, pendingCount } = loaderData;
  const errors = (actionData as { errors?: Record<string, string> } | undefined)?.errors;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 text-sm">
          <Link
            to="/admin/clientes?estado=pending"
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${onlyPending ? "bg-brand-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            Pendientes ({pendingCount})
          </Link>
          <Link
            to="/admin/clientes"
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${!onlyPending ? "bg-brand-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            Todas
          </Link>
        </div>
        {pendingCount > 1 ? (
          <Form method="post">
            <input type="hidden" name="intent" value="approve-all" />
            <CsrfToken />
            <ConfirmButton confirmLabel={`Aprobar ${pendingCount} cuentas`} variant="secondary">
              Aprobar todas
            </ConfirmButton>
          </Form>
        ) : null}
      </div>

      <FormError className="mb-4">{errors?._form}</FormError>

      {users.length === 0 ? (
        <EmptyState description="No hay cuentas para mostrar." />
      ) : (
        <TableShell headers={["Cliente", "Contacto", "Alta", "Estado", "Acciones"]}>
          {users.map((user) => (
            <ClientsRow key={user.id} user={user} />
          ))}
        </TableShell>
      )}
    </div>
  );
}

function ClientsRow({ user }: { user: PublicUser }) {
  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <p className="font-medium">{user.business_name}</p>
        <p className="text-stone-500">
          {formatCuit(user.cuit)} · {user.email}
        </p>
        {user.customer_type ? <p className="text-xs text-stone-400">{user.customer_type}</p> : null}
      </td>
      <td className="px-4 py-3 text-stone-600">
        <p>{user.contact_name ?? "—"}</p>
        <p className="text-stone-500">{user.phone ?? ""}</p>
        {user.province ? <p className="text-xs text-stone-400">{user.province}</p> : null}
      </td>
      <td className="px-4 py-3 text-stone-600">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3">
        <Badge tone={STATUS_BADGE_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {user.status !== "approved" ? (
            <ActionForm intent="approve" userId={user.id}>
              <Button type="submit" variant="secondary" size="sm">
                Aprobar
              </Button>
            </ActionForm>
          ) : null}
          {user.status !== "rejected" ? (
            <ActionForm intent="reject" userId={user.id}>
              <ConfirmButton type="submit" confirmLabel="¿Rechazar?" variant="danger" size="sm">
                Rechazar
              </ConfirmButton>
            </ActionForm>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
