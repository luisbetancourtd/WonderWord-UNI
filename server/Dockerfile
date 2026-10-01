FROM node:24-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Générer le client Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copier le code source
COPY . .

EXPOSE 5000

# Script de démarrage : migrations puis serveur
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
