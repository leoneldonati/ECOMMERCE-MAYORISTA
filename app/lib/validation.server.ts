import { z } from "zod";
import { isValidCuit, normalizeCuit } from "./cuit.server";

// Esquemas de validación de formularios de auth. Se parsean en las actions
// (server-side); los mensajes de error son para el usuario final.

const PASSWORD_MIN = 8;

// Los inputs opcionales llegan como null cuando el campo está vacío
// (FormData.get devuelve string | null): aceptar null y normalizarlo a undefined.
const optionalText = z
  .string()
  .trim()
  .nullable()
  .transform((value) => value || undefined);

const cuitSchema = z
  .string()
  .trim()
  .transform(normalizeCuit)
  .refine((cuit) => cuit.length === 11 && isValidCuit(cuit), "El CUIT es inválido.");

export const loginSchema = z.object({
  email: z.email("Ingresá un email válido.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registerSchema = z.object({
  email: z.email("Ingresá un email válido.").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`),
  businessName: z.string().trim().min(2, "Ingresá la razón social."),
  cuit: cuitSchema,
  contactName: optionalText,
  phone: optionalText,
  province: optionalText,
  customerType: z.enum(["revendedor", "almacen", "distribuidor", "otro"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Aplana los issues de zod a un mapa campo → primer mensaje de error. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}