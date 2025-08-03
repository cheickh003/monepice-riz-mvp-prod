# Guide de Déploiement MonEpiceRiz avec Medusa.js

## 🎯 Vue d'ensemble

Ce guide détaille le processus de déploiement de MonEpiceRiz avec l'intégration Medusa.js en utilisant Docker et les meilleures pratiques de déploiement automatisé.

## 📋 Prérequis

### Serveur de Production
- Ubuntu 20.04 LTS ou plus récent
- Docker 24.0+ et Docker Compose V2
- Minimum 4GB RAM, 2 CPU cores
- 50GB d'espace disque disponible
- Nom de domaine configuré (ex: monepiceriz.com)

### Services Externes
- Base de données PostgreSQL managée (optionnel)
- Redis managé (optionnel)  
- Stockage S3 ou équivalent
- Service d'envoi d'emails
- Certificats SSL (Let's Encrypt recommandé)

## 🚀 Déploiement Initial

### 1. Préparation du Serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose V2
sudo apt install docker-compose-plugin

# Création de l'utilisateur de déploiement
sudo useradd -m -s /bin/bash monepiceriz
sudo usermod -aG docker monepiceriz
```

### 2. Configuration du Projet

```bash
# Clonage du projet
sudo -u monepiceriz git clone https://github.com/votre-org/monepice-riz-mvp-prod.git /opt/monepiceriz
cd /opt/monepiceriz

# Configuration de l'environnement
sudo -u monepiceriz cp .env.example .env.production
sudo -u monepiceriz nano .env.production
```

### 3. Variables d'Environnement de Production

```bash
# Base de données
DATABASE_URL=postgres://user:password@your-db-host:5432/medusa_prod
REDIS_URL=redis://your-redis-host:6379

# Sécurité (GÉNÉRER DES CLÉS FORTES)
JWT_SECRET=your-super-secure-jwt-secret-256-bits
COOKIE_SECRET=your-super-secure-cookie-secret-256-bits

# URLs de production
MEDUSA_ADMIN_CORS=https://admin.monepiceriz.com
STORE_CORS=https://monepiceriz.com,https://www.monepiceriz.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.monepiceriz.com
NEXT_PUBLIC_BASE_URL=https://monepiceriz.com

# Stockage S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=monepiceriz-prod-uploads

# Paiements
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mobile Money Guinée
ORANGE_MONEY_API_KEY=your-orange-key
MTN_MONEY_API_KEY=your-mtn-key
MOOV_MONEY_API_KEY=your-moov-key

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@monepiceriz.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 4. Configuration Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/monepiceriz.com
server {
    listen 80;
    server_name monepiceriz.com www.monepiceriz.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monepiceriz.com www.monepiceriz.com;

    ssl_certificate /etc/letsencrypt/live/monepiceriz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monepiceriz.com/privkey.pem;

    # Optimisations SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 10m;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# API Backend
server {
    listen 443 ssl http2;
    server_name api.monepiceriz.com;

    ssl_certificate /etc/letsencrypt/live/monepiceriz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monepiceriz.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Admin Medusa
server {
    listen 443 ssl http2;
    server_name admin.monepiceriz.com;

    ssl_certificate /etc/letsencrypt/live/monepiceriz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monepiceriz.com/privkey.pem;

    # Restriction d'accès par IP (optionnel)
    # allow 198.51.100.0/24;
    # deny all;

    location / {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Configuration Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=medusa_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=medusa_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - monepiceriz_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa_user -d medusa_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - monepiceriz_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  medusa_backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:7001:7001"
    volumes:
      - medusa_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - monepiceriz_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_MEDUSA_BACKEND_URL=${NEXT_PUBLIC_MEDUSA_BACKEND_URL}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - medusa_backend
    networks:
      - monepiceriz_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  medusa_uploads:

networks:
  monepiceriz_network:
    driver: bridge
```

## 🔄 Processus de Déploiement

### Déploiement Initial

```bash
# 1. Construction des images
make build

# 2. Migration des données (test d'abord)
make migrate-dry

# 3. Migration réelle
make migrate-data

# 4. Démarrage en production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Création utilisateur admin
make admin-user

# 6. Vérification de santé
make health
```

### Déploiement Continu

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Déploiement MonEpiceRiz..."

# Sauvegarde de la base de données
echo "💾 Sauvegarde de la base de données..."
make db-backup

# Récupération des dernières modifications
echo "📥 Récupération du code..."
git pull origin master

# Construction des nouvelles images
echo "🔨 Construction des images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Rolling update avec zero downtime
echo "🔄 Mise à jour rolling..."

# Backend first
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d medusa_backend
sleep 30

# Health check backend
if ! curl -f http://localhost:9000/health; then
    echo "❌ Backend health check failed, rolling back"
    git checkout HEAD~1
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d medusa_backend
    exit 1
fi

# Frontend next
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend
sleep 30

# Health check frontend
if ! curl -f http://localhost:3000/api/health; then
    echo "❌ Frontend health check failed, rolling back"
    git checkout HEAD~1
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    exit 1
fi

# Nettoyage des anciennes images
echo "🧹 Nettoyage..."
docker system prune -f

echo "✅ Déploiement terminé avec succès!"
```

## 📊 Monitoring et Alertes

### Health Checks

```bash
# Script de monitoring - scripts/monitor.sh
#!/bin/bash

SERVICES=("frontend:3000/api/health" "backend:9000/health")
SLACK_WEBHOOK=${SLACK_WEBHOOK_URL}

for service in "${SERVICES[@]}"; do
    name=${service%%:*}
    url="http://localhost:${service#*:}"
    
    if ! curl -f "$url" > /dev/null 2>&1; then
        echo "❌ $name is down"
        
        # Alerte Slack
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 MonEpiceRiz $name is down!\"}" \
            "$SLACK_WEBHOOK"
        
        # Tentative de redémarrage automatique
        docker-compose restart $name
    else
        echo "✅ $name is healthy"
    fi
done
```

### Cron Jobs de Monitoring

```bash
# Ajouter au crontab
# crontab -e

# Health checks toutes les 5 minutes
*/5 * * * * /opt/monepiceriz/scripts/monitor.sh

# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/monepiceriz/scripts/backup.sh

# Nettoyage des logs hebdomadaire
0 3 * * 0 /opt/monepiceriz/scripts/cleanup-logs.sh

# Mise à jour des certificats SSL
0 4 1 * * certbot renew --nginx --quiet
```

## 🔒 Sécurité

### Pare-feu UFW

```bash
# Configuration du pare-feu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Durcissement Docker

```bash
# Configuration daemon Docker - /etc/docker/daemon.json
{
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 🚨 Procédures d'Urgence

### Rollback Rapide

```bash
# scripts/rollback.sh
#!/bin/bash

echo "🔄 Rollback d'urgence..."

# Retour à la version précédente
git checkout HEAD~1

# Reconstruction et redémarrage
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérification
sleep 30
make health

echo "✅ Rollback terminé"
```

### Restauration de Base de Données

```bash
# En cas de corruption de données
make db-restore BACKUP_FILE=backups/backup-YYYYMMDD-HHMMSS.sql
```

## 📈 Optimisations Performance

### Cache Redis

- Sessions utilisateur
- Cache des produits
- Rate limiting
- Cache des requêtes fréquentes

### CDN et Optimisations

```nginx
# Configuration Nginx avec cache
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Cache-Status "HIT";
}

# Compression gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Base de Données

```sql
-- Index optimisés pour Medusa
CREATE INDEX CONCURRENTLY idx_product_status ON product(status) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_product_handle ON product(handle);
CREATE INDEX CONCURRENTLY idx_order_created_at ON "order"(created_at);
CREATE INDEX CONCURRENTLY idx_cart_customer_id ON cart(customer_id);
```

## 🔍 Troubleshooting

### Logs Utiles

```bash
# Logs de l'application
docker-compose logs -f medusa_backend
docker-compose logs -f frontend

# Logs système
journalctl -u docker
tail -f /var/log/nginx/error.log

# Métriques système
docker stats
htop
```

### Problèmes Courants

1. **Out of Memory**: Augmenter la RAM ou configurer swap
2. **Database Lock**: Redémarrer PostgreSQL
3. **SSL Certificates**: Renouveler avec certbot
4. **High CPU**: Profiler avec `docker stats` et optimiser

Ce guide couvre les aspects essentiels du déploiement. Adaptez-le selon votre infrastructure spécifique.