#!/bin/sh
set -e

echo "⏳ Attente de PostgreSQL..."
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "PostgreSQL n'est pas encore prêt, nouvelle tentative dans 3s..."
  sleep 3
done

echo "✅ Base de données synchronisée"
echo "🚀 Démarrage du serveur WonderWord..."
exec npx tsx src/index.ts
