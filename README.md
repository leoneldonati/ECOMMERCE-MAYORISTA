# Despensa Online — Ecommerce B2B de alimentos por mayor

Tienda en línea para **venta mayorista (B2B)** de alimentos no perecederos en
Argentina. Precios en **ARS netos** (sin IVA), **pedido mínimo de $ 10.000** y
precios por **escalas de cantidad**. El acceso a precios y la compra está
restringido a clientes **aprobados por el admin**.

## Stack

- React Router v8 (SSR) + Tailwind CSS v4 + TypeScript strict
- SQLite embebido vía `node:sqlite` (sin dependencias nativas)
- Auth por sesiones (token opaco) + `scrypt` + CSRF + rate limiting en login
- Pago manual: transferencia/depósito, con estados gestionados por el admin

## Requisitos

- **Node ≥ 24** (usa el módulo nativo `node:sqlite`; el Dockerfile usa
  `node:24-alpine`). No hay binarios nativos ni `node-gyp`.

## Desarrollo local

```bash
npm ci
npm run dev
```

El servidor de dev queda en http://localhost:3000.

### Base de datos

La SQLite vive en `data/app.db` (gitignored) y las migraciones se aplican solas
al primer arranque.

```bash
npm run db:setup   # migrate + seed (solo si la base está vacía)
npm run db:reset   # borra la base (solo dev)
```

El seed crea dos cuentas demo:

| Rol              | Email                    | Password      |
| ---------------- | ------------------------ | ------------- |
| Admin            | `admin@mayorista.test`   | `admin1234`   |
| Cliente aprobado | `cliente@mayorista.test` | `cliente1234` |

Podés cambiarlas con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (ver
`.env.example`). **En producción cambiá las credenciales del admin en el primer
arranque.**

### Scripts

| Comando                           | Qué hace                        |
| --------------------------------- | ------------------------------- |
| `npm run dev`                     | Dev con HMR                     |
| `npm run build` / `npm start`     | Build y server de producción    |
| `npm run typecheck`               | Typegen + tsc                   |
| `npm run lint` / `npm run format` | ESLint / Prettier (check)       |
| `npm run format:write`            | Aplica Prettier                 |
| `npm run db:setup`                | migrate + seed                  |
| `npm run db:backup`               | Snapshot de la base (ver abajo) |

## Variables de entorno

Ver `.env.example`. Las usadas por la aplicación:

| Variable                                   | Default       | Uso                               |
| ------------------------------------------ | ------------- | --------------------------------- |
| `DATABASE_PATH`                            | `data/app.db` | Ruta del archivo SQLite           |
| `PORT`                                     | `3000`        | Puerto del server                 |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | demo          | Credenciales del admin del seed   |
| `BACKUP_RETENTION_DAYS`                    | `7`           | Días que se conservan los backups |

`NODE_ENV` se setea en el arranque del README/deploy: en producción controla
cookies `Secure` y el modo dev/prod de React.

## Deploy en un VPS (Docker Compose)

Pensado para un **VPS en Buenos Aires** con Docker + Compose + Nginx como
reverse proxy con TLS. La app escucha solo en `127.0.0.1:3000`; el tráfico
público entra por Nginx en el puerto 443.

### 1. Preparar el server

```bash
# Docker + Compose en Debian/Ubuntu (o seguí la guía oficial del proveedor)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # volver a entrar con la sesión
```

### 2. Subir el proyecto y configurar

```bash
git clone <URL-del-repo> despensa-online && cd despensa-online
cp .env.example .env
# Editar .env: SEED_ADMIN_PASSWORD con una password fuerte
# (se usa SOLO si la base está vacía; cambiala luego igualmente)
```

### 3. Levantar

```bash
sudo docker compose up -d --build
sudo docker compose ps          # healthcheck "healthy"
sudo docker compose logs -f app # ver logs
```

Detalles del `compose.yaml`:

- Volumen **`data:/app/data`**: la SQLite persiste aunque se recrece el container.
- `restart: unless-stopped`: arranca solo al rebootear el server.
- Sidecar `backup`: snapshot diario automático a `data/backups/` con rotación.
- El container corre con **usuario no-root** (entrypoint con `su-exec`).

### 4. Nginx + TLS (Let's Encrypt)

Instalá Nginx y certbot, y usá una configuración como esta:

```nginx
# /etc/nginx/sites-available/despensa-online
server {
  listen 80;
  server_name tu-dominio.com.ar;

  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl;
  server_name tu-dominio.com.ar;

  ssl_certificate     /etc/letsencrypt/live/tu-dominio.com.ar/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com.ar/privkey.pem;

  client_max_body_size 2m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo ln -s /etc/nginx/sites-available/despensa-online /etc/nginx/sites-enabled/
sudo certbot --nginx -d tu-dominio.com.ar
```

## Firewall

Abrí solo los puertos 22, 80 y 443 en el panel del proveedor; si usás UFW:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

### 5. Seguridad y respaldos

- **Backups automáticos**: se generan a las ~03:00 dentro del volumen
  (`data/backups/`). Verificables con `npm run db:backup` (manual).
- **Segunda línea de defensa**: activá el snapshot diario del **proveedor del
  VPS** (Donweb/SyT). El backup lógico cubre la pérdida de datos y el snapshot
  del proveedor cubre el fallo del disco/container.
- **Monitoreo**: un check externo gratuito (p.ej. UptimeRobot) contra la URL
  raíz avisa si la app no responde.

#### Restaurar desde un backup

```bash
sudo docker compose stop app
# Elegí un archivo: ls data/backups/
sudo cp data/backups/app-2026-08-12-031000.db data/app.db
sudo rm -f data/app.db-wal data/app.db-shm   # descartar WAL/shm huérfanos
sudo docker compose start app
```

Las migraciones ya están aplicadas en el snapshot (tabla `_migrations`); si el
backup es de una versión anterior, `getDb()` las vuelve a aplicar al arrancar.

## Notas

- El dev de la SQLite **no descuenta stock** al confirmar; el admin gestiona
  stock/total en `confirmed`.
- Las sesiones tienen TTL de 30 días y son revocables; el login tiene rate limit
  en memoria (5 fallos → 5 minutos de bloqueo).
