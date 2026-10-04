import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: '7d',
    },
  });

  await server.register(prismaPlugin);

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(bookRoutes, { prefix: '/api/books' });

  server.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  try {
    await server.listen({ port: config.port, host: config.host });
    server.log.info(`🚀 Serveur WonderWord démarré sur http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
