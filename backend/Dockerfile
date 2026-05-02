# Imagen base para compilación
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copiar código fuente
COPY . .

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Imagen de producción (ligera)
FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/prisma ./prisma
RUN npm install --omit=dev --ignore-scripts
RUN npx prisma generate
COPY --chown=node:node --from=builder /app/dist ./dist
USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/src/server.js"]
