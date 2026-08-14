# Modelo de datos

Referencia del schema de SQLite (en sync con `app/db/migrations/`).
Motor: SQLite vía `node:sqlite`, pragmas WAL + `foreign_keys` ON.

Convenciones:

- **Dinero**: siempre en CENTAVOS (INTEGER), columnas `*_cents`.
- **Timestamps**: TEXT en ISO-8601 UTC. `created_at` se autogenera;
  `updated_at` se setea explícitamente en los repos.
- **Activos/inactivos** (categorías, productos): INTEGER 0/1.

## `users`

| Columna                    | Tipo         | Notas                                       |
| -------------------------- | ------------ | ------------------------------------------- |
| id                         | INTEGER PK   |                                             |
| email                      | TEXT, UNIQUE | `COLLATE NOCASE`                            |
| password_hash              | TEXT         | scrypt, formato `scrypt$salt$hash`          |
| role                       | TEXT         | `admin` \| `customer`                       |
| status                     | TEXT         | `approved` por defecto (B2C sin aprobación) |
| name                       | TEXT         | Nombre del cliente                          |
| phone / province / address | TEXT NULL    | Datos para coordinar la entrega             |
| created_at / updated_at    | TEXT         |                                             |

## `sessions`

| Columna                 | Tipo                         | Notas                      |
| ----------------------- | ---------------------------- | -------------------------- |
| token                   | TEXT PK                      | Opaco, p. ej. 32 bytes hex |
| user_id                 | INTEGER FK → users (CASCADE) |                            |
| created_at / expires_at | TEXT                         | TTL 30 días                |

## `categories`

| Columna                 | Tipo        | Notas                         |
| ----------------------- | ----------- | ----------------------------- |
| id                      | INTEGER PK  |                               |
| slug                    | TEXT UNIQUE | Identificador de URL          |
| name                    | TEXT        |                               |
| description             | TEXT NULL   |                               |
| sort_order              | INTEGER     | Orden de listado (ascendente) |
| active                  | INTEGER     | 0/1                           |
| created_at / updated_at | TEXT        |                               |

## `products`

| Columna                 | Tipo                    | Notas                                               |
| ----------------------- | ----------------------- | --------------------------------------------------- |
| id                      | INTEGER PK              |                                                     |
| category_id             | INTEGER FK → categories |                                                     |
| slug                    | TEXT UNIQUE             |                                                     |
| name                    | TEXT                    |                                                     |
| description             | TEXT NULL               |                                                     |
| price_cents             | INTEGER                 | Precio único por unidad de venta (centavos)         |
| image_url               | TEXT NULL               | Imagen del producto (URL externa)                   |
| stock                   | INTEGER                 | Unidades disponibles (en stock), `>= 0`             |
| lead_time_days          | INTEGER NULL            | Días de producción (solo si `made_to_order`)        |
| made_to_order           | INTEGER                 | 0/1: 1 = se imprime bajo pedido (sin tope de stock) |
| active                  | INTEGER                 | 0/1                                                 |
| created_at / updated_at | TEXT                    |                                                     |

Semántica de disponibilidad:

- `made_to_order = 1` → "Bajo pedido · N días" (se vende sin límite de stock).
- `made_to_order = 0` y `stock > 0` → "En stock (N)".
- `made_to_order = 0` y `stock = 0` → "Agotado" (no vendible).

## `orders`

| Columna                                            | Tipo               | Notas                                                       |
| -------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| id                                                 | INTEGER PK         |                                                             |
| user_id                                            | INTEGER FK → users |                                                             |
| status                                             | TEXT               | `pending` → `confirmed` → `paid` → `shipped` \| `cancelled` |
| notes                                              | TEXT NULL          |                                                             |
| total_cents                                        | INTEGER            | Suma de subtotales al crear la orden                        |
| created_at / updated_at                            | TEXT               |                                                             |
| confirmed_at / paid_at / shipped_at / cancelled_at | TEXT NULL          |                                                             |
| payment_reference                                  | TEXT NULL          | Comprobante que declaró el cliente al avisar el pago        |
| payment_message                                    | TEXT NULL          | Mensaje opcional del aviso                                  |
| payment_notified_at                                | TEXT NULL          | Fecha del aviso; NULL = sin aviso                           |

## `order_items` (líneas de pedido)

| Columna          | Tipo                          | Notas                                         |
| ---------------- | ----------------------------- | --------------------------------------------- |
| id               | INTEGER PK                    |                                               |
| order_id         | INTEGER FK → orders (CASCADE) |                                               |
| product_id       | INTEGER FK → products         | Sin CASCADE: histórico inmutable              |
| product_name     | TEXT                          | Snapshot del nombre al comprar                |
| image_url        | TEXT NULL                     | Snapshot de la imagen del producto            |
| quantity         | INTEGER                       | `> 0`                                         |
| unit_price_cents | INTEGER                       | Precio por unidad capturado al crear la orden |
| subtotal_cents   | INTEGER                       | `unit_price_cents * quantity`                 |

## `cart_items` (carrito por usuario)

| Columna                 | Tipo                            | Notas |
| ----------------------- | ------------------------------- | ----- |
| id                      | INTEGER PK                      |       |
| user_id                 | INTEGER FK → users (CASCADE)    |       |
| product_id              | INTEGER FK → products (CASCADE) |       |
| quantity                | INTEGER                         | `> 0` |
| created_at / updated_at | TEXT                            |       |

`UNIQUE (user_id, product_id)`: un producto solo puede estar una vez en el carrito.
El carrito es **server-side** (fuente de verdad); los precios/stock se revalidan al
crear la orden, no al agregar.

## `_migrations`

| Columna    | Tipo    |
| ---------- | ------- |
| id         | TEXT PK |
| applied_at | TEXT    |

Registra las migraciones aplicadas; el runner (`app/db/migrate.server.ts`)
las ejecuta en orden dentro de transacciones.

## Índices

- `users`: status, role
- `sessions`: user_id, expires_at
- `products`: category_id, active
- `orders`: user_id, status
- `order_items`: order_id
- `cart_items`: user_id
