# Flujos de negocio

## Registro (B2C, abierto)

1. El visitante completa `/registro`: **nombre**, email, contraseña y datos de
   contacto opcionales (teléfono, provincia, dirección).
2. La cuenta se crea con estado `approved` (sin aprobación del admin) y se
   **inicia la sesión** automáticamente (redirect a `/`).
3. `/mi-cuenta` muestra nombre, email y datos de contacto. El email no puede
   repetirse entre cuentas.

## Login / Logout

- Formulario único para cliente y admin (`/login`); tras loguear se redirige al
  destino pedido (`?next=`) o a `/`.
- El login aplica **rate limiting** por IP+email: 5 fallos seguidos bloquean
  5 minutos (en memoria por proceso).
- Logout solo por `action` POST (nunca en un `loader`): elimina la sesión en DB
  e invalida la cookie.

## Sesiones

- Cookie `impreso_session` (httpOnly, SameSite=Lax, 30 días) que solo lleva un
  **token opaco**; el servidor resuelve el usuario contra la tabla `sessions`.
- Por eso el rol vigente se aplica en cada request y el admin puede revocar
  sesiones (borrando el token).

## Seguridad en formularios

- Todo `action` POST valida **CSRF** (`requireCsrf`): la cookie `impreso_csrf`
  debe coincidir con el campo oculto `_csrf` que inyecta el root loader.
- Los formularios envían el token con el componente `CsrfToken`.

## Catálogo y disponibilidad

- `/productos` es público: lista productos activos con filtros por categoría
  (`?categoria=slug`) y búsqueda (`?q=`, ignora acentos y mayúsculas).
- Cada producto tiene **precio único** por unidad, **imagen**, y un estado de
  disponibilidad derivado (`app/lib/availability.ts`):
  - `made_to_order = 1` → "Bajo pedido · N días" (se imprime por encargo, sin
    tope de stock).
  - `made_to_order = 0` y `stock > 0` → "En stock (N)".
  - `made_to_order = 0` y `stock = 0` → "Agotado" (no vendible).
- El detalle (`/productos/:slug`) muestra imagen, precio y disponibilidad; para
  agregar al carrito hace falta sesión (registro abierto). Producto inexistente
  o inactivo → 404.

## Ciclo de vida del pedido

`pending` → `confirmed` → `paid` → `shipped` | `cancelled`.

- `pending`: recién creado por el cliente.
- `confirmed`: el admin valida y descuenta stock (solo productos de depósito).
- `paid`: el admin registra el pago manual (transferencia/depósito).
- `shipped` / `cancelled`: entrega o cancelación.

El pedido guarda snapshots (nombre, imagen, precio) en `order_items`, así no
cambia aunque el catálogo se modifique.

### Aviso de pago del cliente

- En el detalle del pedido `pending` (`/pedidos/:id`) el cliente declara el
  pago con el **número de comprobante/transferencia** y un mensaje opcional
  (`notifyPayment`). El aviso se guarda en `payment_reference` /
  `payment_message` / `payment_notified_at` y **no cambia el estado**: la orden
  sigue `pending` hasta que el admin verifica la acreditación.
- Mientras siga pendiente, el cliente puede corregir el aviso (se sobrescribe).
- El admin ve el aviso destacado en `/admin/pedidos/:id` y tiene el atajo
  **"Confirmar y marcar pagado"** que confirma + paga en una sola acción.

### Notificaciones al admin (Telegram)

Al crear una orden y al registrar un aviso de pago se envía un mensaje al admin
por Telegram (`notify.server.ts`). El envío es con timeout y nunca rompe la
acción; sin `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` es no-op. Los textos se
construyen en `notify-messages.ts` (puro, con `formatARS` y `formatDateTime`).

## Carrito y checkout

- El carrito es **server-side** (`cart_items` por usuario): el server es la fuente
  de verdad, los precios/stock se revalidan al crear la orden, no al agregar.
- Acceso: cualquier cliente logueado (B2C). Toda acción muta por `intent` en el
  action de `/carrito` y exige CSRF.
- Reglas al crear el pedido (transacción en `createOrderFromCart`):
  - Los productos de **depósito** validan `quantity <= stock` al crear y al
    confirmar; los **bajo pedido** no tienen límite.
  - No hay pedido mínimo ni mínimo por línea.
  - Si algo no valida, el pedido no se crea (nada queda a medias).
- Al crear se guardan snapshots y se **vacía el carrito**. El cliente ve los
  datos de la cuenta para transferir (`PAYMENT_INFO`, placeholder) en el detalle
  del pedido `pending`. La entrega se coordina por teléfono/WhatsApp con la
  dirección que el admin ve en `/admin/pedidos/:id`.
- `/pedidos` lista los pedidos del usuario; `/pedidos/:id` solo muestra los del
  propio usuario (los ajenos responden 404).

## Panel admin

El panel vive en `/admin` (acceso exclusivo con rol `admin`, gate por middleware
`requireAdmin`; todo `action` exige CSRF). El layout `admin.tsx` tiene pestañas
Resumen / Clientes / Pedidos / Productos.

### Clientes

- `/admin/clientes` lista todos los clientes con nombre, email, teléfono y
  dirección (para coordinar entregas). No hay aprobación: el registro es abierto.

### Gestionar pedidos

- `/admin/pedidos` lista todas las órdenes con datos del cliente (JOIN a users),
  con chips de filtro por estado (por defecto "Pendientes").
- `/admin/pedidos/:id`: dos columnas (datos del cliente con dirección/teléfono |
  ítems + total). Los botones avanzan el estado según la transición permitida
  (`transitionOrderStatus`):
  - `pending → confirmed`: descuenta stock **solo de productos de depósito**
    (los bajo pedido no restan stock).
  - `confirmed → paid | cancelled`
  - `paid → shipped`
  - No se puede retroceder; `cancelled` solo desde `pending`/`confirmed`.

### Productos

- `/admin/productos` lista todo el catálogo con precio y disponibilidad; permite
  **activar/desactivar** y **eliminar** (la FK de `order_items` impide borrar un
  producto con pedidos).
- `/admin/productos/nuevo` y `/admin/productos/:id/editar`: formulario con
  categoría, slug (autogenerado desde el nombre, editable, unicidad validada),
  **precio** (se ingresa en pesos y se convierte a centavos con `pesosToCents`),
  **URL de imagen**, **stock**, **días de producción** y el switch
  **"Impresión bajo pedido"** (sin tope de stock).
