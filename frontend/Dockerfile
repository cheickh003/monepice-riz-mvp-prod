# Dockerfile multi-stage pour Frontend Next.js
FROM node:18-alpine AS base

# Installer les dépendances système
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Stage de développement
FROM base AS development

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check pour le dev
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "dev"]

# Stage de build
FROM base AS builder

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build de l'application Next.js
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

RUN apk add --no-cache curl

WORKDIR /app

# Créer utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check pour la production
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]