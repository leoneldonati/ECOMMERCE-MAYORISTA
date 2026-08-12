import { data } from "react-router";

// Respuesta de error de formulario tipada: `_form` es el error general que
// los componentes muestran con FormError. Cada action lo usa para no repetir
// el helper localmente.

export function errorResponse(message: string, status = 400) {
  return data({ errors: { _form: message } }, { status });
}
