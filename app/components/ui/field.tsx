import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// Campos de formulario accesibles: generan id propio, ligan error y hint al
// control con aria-describedby (ids reales), marcan aria-invalid y anuncian el
// error con role="alert" (aria-live implícito). Reemplazan los <label>+<input>
// sueltos en login/registro.

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  controlId: string;
  hintId?: string;
  errorId?: string;
}

function FieldShell({
  label,
  error,
  hint,
  required,
  className,
  children,
  controlId,
  hintId,
  errorId,
}: FieldShellProps) {
  return (
    <label htmlFor={controlId} className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="text-stone-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span id={hintId} className="text-xs text-stone-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

const CONTROL_CLASS =
  "rounded-md border border-stone-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";

export function TextField({
  label,
  error,
  hint,
  required,
  className,
  inputRef,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement> & { inputRef?: Ref<HTMLInputElement> }) {
  const baseId = useId();
  const id = baseId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = describeId(hintId, hint, errorId, error);
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <input {...props} ref={inputRef} id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={CONTROL_CLASS} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = describeId(hintId, hint, errorId, error);
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <select {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={CONTROL_CLASS}>
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = describeId(hintId, hint, errorId, error);
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${CONTROL_CLASS} resize-y`}
      />
    </FieldShell>
  );
}

/** Retorna los ids a describir (solo los que existen: hint y/o error). */
function describeId(hintId: string, hint: string | undefined, errorId: string, error?: string): string | undefined {
  return [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
}