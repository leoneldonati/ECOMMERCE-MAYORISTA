#!/bin/sh
set -e

# El volumen de la SQLite (/app/data) llega montado como root: como PID1
# estamos en root, entonces aseguramos dueño y permisos antes de bajar a un
# usuario no-root vía su-exec. El resto de /app solo necesita lectura.
mkdir -p /app/data
chown -R node:node /app/data

exec su-exec node "$@"