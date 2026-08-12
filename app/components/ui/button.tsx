import { useNavigation } from "react-router";
import type { FetcherWithComponents } from "react-router";
import type { ComponentProps } from "react";
import { Spinner } from "./spinner";

// Botones base con variantes de la paleta de marca, foco visible accesible
// y estado de carga. SubmitButton cubre formularios de página (useNavigation);
// FetcherSubmitButton cubre las acciones inline con useFetcher (carrito).

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-60",
  ghost: "text-stone-600 hover:text-stone-900 disabled:opacity-60",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra el spinner y bloquea el botón. */
  loading?: boolean;
  /** Texto que reemplaza al contenido mientras carga. */
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

/**
 * Botón para formularios de página (POST/GET con navegación): entra en pending
 * mientras la request del formulario está en vuelo, evitando el doble submit.
 */
export function SubmitButton({
  pendingLabel = "Enviando…",
  children,
  ...props
}: Omit<ButtonProps, "loading"> & { pendingLabel?: string }) {
  const navigation = useNavigation();
  // formAction distingue una submission propia de una navegación por link.
  const isPending = navigation.state !== "idle" && navigation.formAction !== undefined;
  return (
    <Button loading={isPending} loadingLabel={pendingLabel} {...props}>
      {children}
    </Button>
  );
}

/** Ídem SubmitButton pero para acciones vía useFetcher (sin navegación). */
export function FetcherSubmitButton({
  fetcher,
  pendingLabel = "Enviando…",
  children,
  ...props
}: Omit<ButtonProps, "loading"> & {
  fetcher: Pick<FetcherWithComponents<unknown>, "state">;
  pendingLabel?: string;
}) {
  const isPending = fetcher.state === "submitting";
  return (
    <Button loading={isPending} loadingLabel={pendingLabel} {...props}>
      {children}
    </Button>
  );
}