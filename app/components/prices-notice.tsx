import { Alert } from "./ui/alert";
import { ButtonLink } from "./ui/button";

export type PricesNoticeStatus = "visitor" | "pending" | "rejected";

const CARD_MESSAGE: Record<PricesNoticeStatus, string> = {
  visitor: "Ingresá para ver precios",
  pending: "Precios disponibles al aprobar la cuenta",
  rejected: "Cuenta rechazada",
};

/**
 * Aviso de que los precios (y stock) no están disponibles.
 * `variant="card"` es una línea compacta para tarjetas; "panel" es el bloque
 * con CTA que se muestra en el detalle de producto.
 */
export function PricesNotice({
  status,
  variant = "panel",
}: {
  status: PricesNoticeStatus;
  variant?: "card" | "panel";
}) {
  if (variant === "card") {
    return <p className="text-sm text-stone-500">{CARD_MESSAGE[status]}</p>;
  }

  if (status === "visitor") {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-6 text-center text-sm">
        <p className="mb-4 text-stone-600">
          Los precios mayoristas se muestran a clientes con cuenta aprobada.
        </p>
        <div className="flex justify-center gap-3">
          <ButtonLink to="/registro">Solicitar cuenta</ButtonLink>
          <ButtonLink to="/login" variant="secondary">
            Ingresar
          </ButtonLink>
        </div>
      </div>
    );
  }

  const title = status === "pending" ? "Tu cuenta está en revisión" : "Tu cuenta fue rechazada";
  const detail =
    status === "pending"
      ? "Cuando un administrador la apruebe vas a poder ver precios y stock."
      : "Si pensás que es un error, comunicate con nosotros para revisar el caso.";
  return (
    <Alert tone="warning" padding="md">
      <strong>{title}.</strong> {detail}
    </Alert>
  );
}
