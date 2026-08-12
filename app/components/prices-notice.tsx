import { Link } from "react-router";

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
          <Link
            to="/registro"
            className="rounded-md bg-brand-700 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-800"
          >
            Solicitar cuenta
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Ingresar
          </Link>
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
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <strong>{title}.</strong> {detail}
    </div>
  );
}