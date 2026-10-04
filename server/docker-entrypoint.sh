#!/bin/sh
set -e

echo "⏳ Attente de PostgreSQL..."
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "PostgreSQL n'est pas encore prêt, nouvelle tentative dans 3s..."
  sleep 3
done

echo "✅ Base de données synchronisée"

echo "📚 Alimentation du catalogue littéraire..."
npx tsx src/seed.ts || echo "⚠️ Seed terminé ou éléments déjà existants"

echo "🚀 Démarrage du serveur WonderWord..."
exec npx tsx src/index.ts
