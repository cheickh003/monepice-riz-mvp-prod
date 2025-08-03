# Dockerfile multi-stage pour Medusa Backend
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    curl

WORKDIR /app

# Copier les fichiers package pour optimiser le cache Docker
COPY package*.json ./
COPY yarn.lock* ./

# Stage de développement
FROM base AS development

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY . .

# Exposer les ports Medusa
EXPOSE 9000 7001

# Variables d'environnement par défaut
ENV NODE_ENV=development
ENV PORT=9000

# Script de démarrage avec migration automatique
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# Stage de build pour production
FROM base AS builder

# Installer les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

RUN apk add --no-cache curl

WORKDIR /app

# Copier les dépendances de production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Créer utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S medusa -u 1001

# Changer la propriété des fichiers
RUN chown -R medusa:nodejs /app
USER medusa

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

CMD ["npm", "start"]