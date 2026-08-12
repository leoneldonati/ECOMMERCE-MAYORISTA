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

// --- Panel admin: producto ---

const MAX_TIERS = 6;

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresá el nombre del producto."),
    slug: z
      .string()
      .trim()
      .min(1, "El slug es obligatorio.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo admite minúsculas, números y guiones."),
    categoryId: z.coerce.number().int().positive("Elegí una categoría."),
    unitLabel: z.string().trim().min(1, "Ingresá la unidad de venta.").default("caja"),
    packageSize: optionalText,
    description: optionalText,
    stock: z.coerce.number().int().nonnegative("El stock no puede ser negativo."),
    active: z.boolean().default(true),
    tiers: z
      .array(
        z.object({
          minQty: z.coerce.number().int().positive("Cada escala necesita una cantidad mínima."),
          priceCents: z.coerce.number().int().nonnegative("Cada escala necesita un precio."),
        }),
        { message: "Agregá al menos una escala de precio." },
      )
      .min(1, "Agregá al menos una escala de precio.")
      .max(MAX_TIERS, `No más de ${MAX_TIERS} escalas.`),
  })
  .refine(
    (data) => {
      const mins = data.tiers.map((tier) => tier.minQty);
      return mins.every((min, index) => index === 0 || min > mins[index - 1]);
    },
    {
      message: "Las cantidades de escala deben ser ascendentes y sin repetir.",
      path: ["tiers"],
    },
  );

export type ProductInput = z.infer<typeof productSchema>;

// --- Aviso de pago del cliente ---

export const paymentNotificationSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(3, "Ingresá el número de transferencia o comprobante.")
    .max(60, "La referencia es demasiado larga (máx. 60 caracteres)."),
  message: z
    .string()
    .trim()
    .max(200, "El mensaje es demasiado largo (máx. 200 caracteres).")
    .nullable()
    .transform((value) => value || undefined),
});

export type PaymentNotificationInput = z.infer<typeof paymentNotificationSchema>;

/** Aplana los issues de zod a un mapa campo → primer mensaje de error. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
