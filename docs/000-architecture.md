# Arquitectura — Ecommerce B2B Alimentos Mayorista

Referencia de decisiones de diseño y stack del proyecto. Los cambios se acuerdan
en [ADR] cuando hay un trade-off relevante.

## Objetivo

Tienda en línea para **venta mayorista (B2B)** de alimentos no perecederos en
Argentina. Precios en **ARS netos** (sin IVA), **mínimo por pedido de $ 10.000**
y precios por **escalas de cantidad**. El acceso a precios y la compra están
restringidos a clientes **aprobados por el admin**.

## Stack

- **React Router v8** (SSR) + **Tailwind CSS v4** + **TypeScript strict**
- **SQLite embebido** vía `node:sqlite` (incluido en Node ≥ 23.4): sin
  dependencias nativas, sin servicios externos, portable a Postgres después.
- **Hashing de contraseñas**: `scrypt` (`node:crypto`), formato `scrypt$salt$hash`.
- **Sesiones**: tabla `sessions` con **token opaco** + expiración (TTL 30 días).
- **Validación**: `zod` para los formularios (registro y login).
- **CLI**: `tsx` para los scripts `db:*`.

## Decisiones clave

### SQLite en Fase 1
El archivo vive en `data/app.db` (gitignored). Todo el acceso pasa por los repos
de `app/db/repos/*`: las rutas/loaders nunca tocan SQL directo, lo que permite
cambiar de motor sin reescribir la aplicación.

### `node:sqlite` en vez de `better-sqlite3`
Módulo nativo del runtime: sin `node-gyp`, compila sin drama en `node:24-alpine`
y no agrega dependencias. La API es síncrona y con prepared statements.

### Separación servidor/cliente
Todo el que accede a la DB vive en archivos `*.server.ts`. El plugin
`react-router:dot-server` los excluye del bundle del cliente; los loaders/actions
se ejecutan siempre en el servidor. `pricing.ts` y `money.ts` son puros y
compartidos (cliente + servidor).

### Dinero en centavos
Las columnas `*_cents` (INTEGER) evitan errores de coma flotante. El formateo
se centraliza en `formatARS()` (`Intl` `es-AR`, ARS, sin decimales).

### Pago manual
No hay pasarela: la orden se crea `pending` y el admin la marca
`confirmed → paid → shipped`. El cliente paga por transferencia/depósito.

## Autenticación (Fase 1-b)

- **Carrier de sesión**: cookie `mayorista_session` (httpOnly, SameSite=Lax,
  `secure` en producción) que solo transporta un **token opaco**. Cada gate
  resuelve el usuario contra la tabla `sessions` (`app/lib/auth.server.ts`),
  por lo que el estado/rol siempre es el vigente y las sesiones son revocables.
- **Gates por middleware de ruta** (`app/lib/middleware.server.ts`:
  `requireUser`) que redirigen a `/login?next=...` y exponen el usuario vía
  `userContext` (`app/lib/context.server.ts`).
- **CSRF**: doble envío con cookie `mayorista_csrf` + campo `_csrf`
  (`app/lib/csrf.server.ts`, `requireCsrf` en todos los actions POST).
- **Rate limiting** de login en memoria por IP+email (`app/lib/rate-limit.server.ts`):
  5 fallos → bloqueo de 5 minutos (se reinicia al reiniciar el proceso).
- **Formularios con `zod`** (`app/lib/validation.server.ts`): login y registro,
  con CUIT validado por dígito verificador (`app/lib/cuit.server.ts`).

## Headers de seguridad
El middleware de root agrega a todas las respuestas `X-Content-Type-Options`,
`X-Frame-Options` y `Referrer-Policy` (ver `app/root.tsx`).

## Estructura de carpetas

```
app/
  db/
    client.server.ts   # Singleton DB + pragmas + apertura
    migrate.server.ts  # Runner de migraciones (tabla _migrations)
    migrations/        # Migraciones como módulos TS (id + SQL)
    seed.server.ts     # Seed idempotente (catálogo + usuarios demo)
    seed-data.ts       # Datos del seed (categorías, productos, escalas)
    types.ts           # Tipos de entidades (solo types)
    repos/             # Acceso a datos por entidad
  lib/
    password.server.ts # scrypt (hash/verify)
    cuit.server.ts     # Validación CUIT (dígito verificador AFIP)
    pricing.ts         # Escalas de precio (compartido)
    money.ts           # formatARS (compartido)
  routes/              # Rutas React Router (flat routes)
scripts/               # CLI de base de datos (db:*)
docs/                  # Documentación de arquitectura
```

## Flujo de pedido

Cliente registrado y aprobado arma pedido (mínimo $ 10.000) → orden `pending` →
admin `confirmed` (stock + total) → `paid` (recibió transferencia/depósito) →
`shipped` o `cancelled`.

## Fases del proyecto

1. ✅ Infraestructura de datos + auth (registro, login, sesiones, CSRF)
2. ⬜ Catálogo B2B (precios según rol, visibles para aprobados)
3. ⬜ Carrito + pedido (mínimo $ 10.000, pago manual)
4. ⬜ Panel admin (aprobar clientes, productos, pedidos)
5. ⬜ Pulido y refinamientos