#!/bin/sh
set -e

echo "🚀 Starting Medusa Backend..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Attendre que Redis soit prêt
echo "⏳ Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "✅ Redis is ready!"

# Exécuter les migrations de base de données
echo "🔄 Running database migrations..."
npm run migrate || echo "⚠️  Migration failed, but continuing..."

# Seed initial data si nécessaire
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding development data..."
  npm run seed || echo "⚠️  Seeding failed, but continuing..."
fi

echo "🎯 Starting Medusa server..."
exec "$@"