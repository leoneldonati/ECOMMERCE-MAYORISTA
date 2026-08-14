# AGENTS.md

Convenciones para trabajar en este repositorio. Léelo antes de tocar código.

## Contexto del proyecto

Ecommerce B2C de productos impresos en 3D (venta por unidad) en Argentina.
Precios en ARS (netos) con precio único por producto, venta en stock o bajo
pedido (fabricación a pedido con lead time). Modelo: registro abierto (sin
aprobación), pagos manuales (transferencia/depósito) y envío coordinado con el
cliente tras confirmar el pago.

## Stack y decisiones

- React Router v8 (SSR) + Tailwind CSS v4 + TypeScript (strict)
- Base de datos: SQLite embebido vía `node:sqlite` (sin dependencias nativas)
- Auth: sesiones en la tabla `sessions` (token opaco) + hashing `scrypt` (`node:crypto`) +
  CSRF de doble envío + rate limiting en memoria para login
- Validación de formularios con `zod`
- Código de servidor exclusivo en archivos `*.server.ts` (convención del plugin
  `react-router:dot-server`; no importarlos desde código de cliente)
- CLI de base de datos con `tsx` (scripts `db:*`)

## Servidor vs cliente

- `app/db/*`, `app/lib/*.server.ts` son SOLO servidor (sufijo `.server.ts`).
  Importarlos únicamente desde loaders/actions u otros `.server.ts`.
- `app/lib/money.ts`, `dates.ts`, `availability.ts`, `order-ui.ts` y
  `notify-messages.ts` son compartidos (cliente + servidor): código puro, sin
  acceso a DB ni a `process.env`. Lo mismo aplica a `app/components/ui/*`
  (componentes sin importaciones `.server`). El envío (IO/red) sí va en
  `notify.server.ts` (solo servidor).
- `app/db/types.ts` solo tipos (sin runtime); importar siempre con `import type`.

## Comandos

- `npm run dev` — desarrollo con HMR
- `npm run typecheck` — typegen + tsc (obligatorio antes de dar por terminado un cambio)
- `npm run lint` — ESLint (flat; react-hooks clásico + prettier-config al final)
- `npm run format` — Prettier en modo check; `npm run format:write` aplica
- `npm run build` / `npm start` — producción
- `npm run db:migrate` — aplica migraciones pendientes
- `npm run db:seed` — seed idempotente (solo si la base está vacía)
- `npm run db:reset` — borra la base de datos (solo dev)
- `npm run db:setup` — migrate + seed

## Convenciones de código

- Comentarios y documentación en español; explican el POR QUÉ, no el QUÉ.
  No hay comentarios obvios ni código muerto (el código muerto se elimina).
- Dinero siempre en CENTAVOS (integer), columnas `*_cents`. Formatear con
  `formatARS()` de `app/lib/money.ts`.
- Timestamps en ISO-8601 UTC (TEXT). `created_at` se autogenera; `updated_at`
  se actualiza explícitamente en los repos.
- Toda función pública de repo/lib lleva doc cuando la firma no sea evidente.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), cuerpo en español.

## Documentación

- `docs/000-architecture.md` — decisiones de diseño y stack
- `docs/001-schema.md` — modelo de datos (mantener en sync con las migraciones)
- `docs/002-flows.md` — flujos de negocio (registro/aprobación, pedidos, seguridad)
- Al tocar la base de datos: actualizar la migración y `docs/001-schema.md` juntos.
