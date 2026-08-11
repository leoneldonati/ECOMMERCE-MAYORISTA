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
  - El stock se valida pero **no se descuenta**: el pedido queda `pending` y el
    admin gestiona el inventario al confirmar (Fase 4).
  - El total debe cubrir el pedido mínimo (ARS $ 10.000, `MIN_ORDER_CENTS`).
  - Si algo no valida, el pedido no se crea (nada queda a medias).
- Al crear, se guardan snapshots y se **vacía el carrito**. El cliente ve los
  datos de la cuenta para transferir (`PAYMENT_INFO`, placeholder) en el detalle
  del pedido `pending`.
- `/pedidos` lista los pedidos del usuario; `/pedidos/:id` solo muestra los del
  propio usuario (los ajenos responden 404, no filtra datos).
