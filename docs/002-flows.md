# Flujos de negocio

## Registro y aprobación de clientes

1. El visitante completa el formulario de `/registro`: razón social, CUIT (validado
   con el dígito verificador de AFIP), email, contraseña y datos de contacto.
   El email y el CUIT no pueden repetirse entre cuentas.
2. La cuenta se crea con estado `pending` y se **inicia la sesión**
   automáticamente (redirect a `/mi-cuenta`).
3. En `/mi-cuenta` el cliente ve su estado: `pending` (en revisión),
   `approved` (aprobado) o `rejected` (rechazado).
4. El admin aprueba o rechaza desde el panel (Fase 4). Al aprobar, el cliente
   pasa a ver precios y comprar; al rechazar, pierde el acceso pero puede volver
   a intentar con otro email (el CUIT sigue siendo único).

## Login / Logout

- Mismo formulario para cliente y admin (`/login`); el rol dirige el destino:
  `pending` → `/mi-cuenta`, `approved`/`admin` → el destino pedido (`?next=`) u home.
- El login aplica **rate limiting** por IP+email: 5 fallos seguidos bloquean
  5 minutos (en memoria por proceso).
- Logout solo por `action` POST (nunca en un `loader`): elimina la sesión en DB
  e invalida la cookie.

## Sesiones

- Cookie `mayorista_session` (httpOnly, SameSite=Lax, 30 días) que solo lleva un
  **token opaco**; el servidor resuelve el usuario contra la tabla `sessions`.
- Por eso el estado/rol vigente se aplica en cada request y el admin puede
  revocar sesiones (borrando el token) o bloquear clientes (cambiando el estado).

## Seguridad en formularios

- Todo `action` POST valida **CSRF** (`requireCsrf`): la cookie `mayorista_csrf`
  debe coincidir con el campo oculto `_csrf` que inyecta el root loader.
- Los formularios envían el token con el componente `CsrfToken`.

## Escalas de precio

El precio por unidad de venta depende de la cantidad comprada. Gana la escala
con mayor `min_qty` menor o igual a la cantidad; si ninguna aplica, el producto
no se puede agregar. Ver `app/lib/pricing.ts`.

## Catálogo (Fase 2)

- `/productos` es público: lista productos activos con filtros por categoría
  (`?categoria=slug`) y búsqueda (`?q=`). La búsqueda ignora acentos y
  mayúsculas ("cafe" encuentra "Café").
- Los chips de categoría muestran el conteo de productos activos; las categorías
  sin productos activos no se listan.
- **Visibilidad**: precios y stock solo para clientes con cuenta `approved` (o
  `admin`) — `canSeePrices()` en `app/lib/access.ts`. Para el resto, el
  view-model (`app/lib/catalog.server.ts`) no serializa montos (defensa en
  profundidad) y la UI muestra un aviso según el estado: visitante → CTA
  registro/login; `pending` → "cuenta en revisión"; `rejected` → "cuenta rechazada".
- El detalle (`/productos/:slug`) muestra la tabla de escalas de precio
  ("desde X cajas → $Y por unidad"). Producto inexistente o inactivo → 404.
- El stock se muestra únicamente a quien ve precios.

## Ciclo de vida del pedido (Fase 3)

`pending` → `confirmed` → `paid` → `shipped` | `cancelled`.

- `pending`: recién creado por el cliente.
- `confirmed`: el admin valida stock y total.
- `paid`: el admin registra el pago manual (transferencia/depósito).
- `shipped` / `cancelled`: entrega/retiro o cancelación.

El pedido guarda snapshots (nombre, unidad, precio) en `order_items`, así no
cambia aunque el catálogo se modifique.

### Aviso de pago del cliente

- En el detalle del pedido `pending` (`/pedidos/:id`) el cliente declara el
  pago con el **número de comprobante/transferencia** y un mensaje opcional
  (`notifyPayment` en `orders.server.ts`). El aviso se guarda en
  `payment_reference` / `payment_message` / `payment_notified_at` y **no cambia
  el estado**: la orden sigue `pending` hasta que el admin verifica la
  acreditación.
- Solo se permite mientras `pending` (`not_pending` en caso contrario). Mientras
  siga pendiente, el cliente puede corregir el aviso (se sobrescribe).
- El admin ve el aviso destacado en `/admin/pedidos/:id` y en el listado (badge
  "Pago declarado"), y tiene un atajo **"Confirmar y marcar pagado"** que
  descuenta el stock (confirmar) y deja la orden `paid` en una sola acción.

## Carrito y checkout (Fase 3)

- El carrito es **server-side** (`cart_items` por usuario): el server es la fuente
  de verdad, los precios/stock se revalidan al crear la orden, no al agregar.
- Acceso: solo clientes `approved` (o `admin`); los demás van a `/mi-cuenta`.
  Toda acción muta por `intent` en el action de `/carrito` y exige CSRF.
- En el detalle de producto, el cliente elige cantidad y ve el precio de la
  escala aplicable en vivo (calculador puro, `app/lib/orders.ts`).
- Reglas al crear el pedido (validadas en transacción en
  `createOrderFromCart`):
  - Cada línea debe alcanzar el mínimo de su primera escala; si no, la línea no
    cuenta para el total.
  - El stock se valida al crear la orden pero **no se descuenta** ahí: se
    descuenta al confirmar en el panel (ver "Gestionar pedidos").
  - El total debe cubrir el pedido mínimo (ARS $ 10.000, `MIN_ORDER_CENTS`).
  - Si algo no valida, el pedido no se crea (nada queda a medias).
- Al crear, se guardan snapshots y se **vacía el carrito**. El cliente ve los
  datos de la cuenta para transferir (`PAYMENT_INFO`, placeholder) en el detalle
  del pedido `pending`.
- `/pedidos` lista los pedidos del usuario; `/pedidos/:id` solo muestra los del
  propio usuario (los ajenos responden 404, no filtra datos).

## Panel admin (Fase 4)

El panel vive en `/admin` (acceso exclusivo con rol `admin`, gate por middleware
`requireAdmin`; todo `action` exige CSRF). El layout `admin.tsx` tiene pestañas
Resumen / Clientes / Pedidos / Productos.

### Aprobar clientes

- `/admin/clientes` lista cuentas (`?estado=pending` para solo pendientes, por
  defecto todas). Cada fila permite **Aprobar** (1 clic) o **Rechazar**
  (confirmación de 2 clics) → `setUserStatus` actualiza `status` y el timestamp
  (`approved_at`/`rejected_at`).
- Con más de un pendiente hay un "Aprobar todas" (también con confirmación).
- Al aprobar se desbloquea precio/stock y compra; al rechazar, el cliente lo ve
  en `/mi-cuenta`.

### Gestionar pedidos

- `/admin/pedidos` lista todas las órdenes con datos del cliente (JOIN a users),
  con chips de filtro por estado (por defecto "Pendientes", lo accionable primero).
- `/admin/pedidos/:id`: dos columnas (datos del cliente | ítems + total). Los
  botones avanzan el estado según la transición permitida
  (`transitionOrderStatus` en `orders.server.ts`):
  - `pending → confirmed`: valida el stock de cada ítem y **descuenta el stock**
    dentro de la misma transacción (falla con mensaje claro si no alcanza).
  - `confirmed → paid | cancelled`
  - `paid → shipped`
  - No se puede retroceder; `cancelled` solo desde `pending`/`confirmed`.
  - Con aviso de pago presente en una orden `pending`, se ofrece el botón
    **"Confirmar y marcar pagado"**, que ejecuta `confirmed` + `paid` (descuenta
    stock) en una sola request.

### Productos

- `/admin/productos` lista todo el catálogo (activos e inactivos) con stock y
  escalas; permite **activar/desactivar** y **eliminar** (la FK de `order_items`
  impide borrar un producto con pedidos, integridad histórica).
- `/admin/productos/nuevo` y `/admin/productos/:id/editar`: formulario con
  categoría, slug (autogenerado desde el nombre, editable, unicidad validada),
  unidad de venta, presentación, stock, activo y hasta 6 **renglones dinámicos
  de escala** (cantidad mínima + precio). Los precios se ingresan en **pesos**
  (formato `1.200,50` aceptado) y se convierten a centavos (`pesosToCents`);
  las escalas deben ser ascendentes y sin repetir (validación zod + CHECK de DB).
