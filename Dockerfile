FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

# Runtime: usuario no-root via entrypoint con su-exec. Incluye scripts/backup.ts
# para el sidecar de backups (self-contained, corre con el node nativo).
FROM node:24-alpine
RUN apk add --no-cache su-exec
ENV NODE_ENV=production
ENV PORT=3000
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY scripts/backup.ts /app/scripts/backup.ts
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
WORKDIR /app
ENTRYPOINT ["docker-entrypoint.sh"]
# cross-env es devDependency (no disponible en prod); como NODE_ENV ya está
# seteado arriba, react-router-serve corre directo.
CMD ["node", "node_modules/.bin/react-router-serve", "./build/server/index.js"]