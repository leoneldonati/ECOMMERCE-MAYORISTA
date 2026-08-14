# Go-live: puesta en producción

Runbook paso a paso para subir **Impreso Online** a un VPS (Buenos Aires)
con Docker Compose + Nginx/TLS. Presupone un VPS con Docker y Compose, un
dominio propio y las credenciales de pago/Telegram listas.

## Antes de empezar (definir)

- [ ] Dominio y DNS apuntando al IP del VPS.
- [ ] Datos reales de la cuenta para `PAYMENT_INFO` (CBU/alias/titular).
- [ ] Token del bot de Telegram y `chat_id` (para notificaciones).
- [ ] Password fuerte para `SEED_ADMIN_PASSWORD`.

## 1. Preparar el VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# cerrar y reabrir la sesión
```

## 2. Clonar y configurar

```bash
git clone git@github.com:leoneldonati/ECOMMERCE-MAYORISTA.git impreso-online
cd impreso-online
cp .env.example .env
# Editar .env:
#   SEED_ONLY_ADMIN=1
#   SEED_ADMIN_EMAIL=admin@tu-dominio.com
#   SEED_ADMIN_PASSWORD=<fuerte>
#   TELEGRAM_BOT_TOKEN=<token>
#   TELEGRAM_CHAT_ID=<id>
#   APP_URL=https://tu-dominio.com.ar
```

## 3. Levantar la app

```bash
sudo docker compose up -d --build
sudo docker compose ps          # healthcheck "healthy"
curl -I http://127.0.0.1:3000   # 200
```

## 4. Crear el admin (una sola vez)

```bash
sudo docker compose run --rm seed
```

Con `SEED_ONLY_ADMIN=1` crea **solo el admin** (sin catálogo demo). El catálogo
real se carga desde `/admin/productos`.

## 5. Nginx + TLS (Let's Encrypt)

Ver la sección "Deploy" del README: instalar `nginx` + `certbot`, configurar el
reverse proxy a `127.0.0.1:3000` con redirect HTTP→HTTPS, y emitir el
certificado. Abrir en el firewall solo 22/80/443.

## 6. Post-deploy

- [ ] `/` y `/productos` responden por HTTPS.
- [ ] Login como admin (`/admin`), cargar categorías y productos reales.
- [ ] `PAYMENT_INFO` con la cuenta real (cambiar si quedó placeholder).
- [ ] Notificaciones: `docker compose exec backup node scripts/backup.ts` (backup
      manual) y confirmar el mensaje de prueba de Telegram.
- [ ] **Cambiar la password del admin** y no reusar la del seed.
- [ ] Activar el snapshot diario del **proveedor** del VPS (segunda línea de backup).
- [ ] Monitoreo externo (p. ej. UptimeRobot) sobre `https://tu-dominio/`.

## Operación

- Logs: `sudo docker compose logs -f app`
- Backup manual: `sudo docker compose exec backup node scripts/backup.ts`
- Restaurar: `sudo docker compose stop app` → copiar un snapshot de
  `data/backups/` a `data/app.db` → `sudo docker compose start app`
- Actualizar: `git pull && sudo docker compose up -d --build`

## Rollback

- Código: volver a un commit previo con `git checkout <sha> && docker compose up -d --build`.
- Datos: restaurar un snapshot (ver arriba). Las migraciones son acumulativas:
  si el snapshot es más nuevo que el código, no se puede bajar de versión sin
  restaurar el snapshot correspondiente.
