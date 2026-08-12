import { useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "./ui/button";

// Botón de confirmación de 2 clics para acciones destructivas (rechazar,
// cancelar pedido, eliminar producto…). El primer click arma el estado "¿Seguro?"
// durante 3 segundos; el segundo ejecuta el submit del form en el que vive.
// No usa modales ni confirm(): es CSS-only y accesible por teclado.

const ARM_MS = 3000;

export function ConfirmButton({
  children,
  confirmLabel = "¿Seguro?",
  pendingLabel = "Guardando…",
  variant = "danger",
  size = "sm",
  className,
  ...props
}: ButtonProps & { confirmLabel?: string; pendingLabel?: string }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);
  const navigation = useNavigation();
  const isPending = navigation.state !== "idle" && navigation.formAction !== undefined;

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!armed) {
      event.preventDefault();
      setArmed(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setArmed(false), ARM_MS);
    }
  }

  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      className={`${className ?? ""} ${armed ? "ring-2 ring-red-300 ring-offset-1" : ""}`}
      loading={isPending}
      loadingLabel={pendingLabel}
      onClick={handleClick}
      aria-label={armed ? confirmLabel : undefined}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
