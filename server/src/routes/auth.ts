import { FastifyInstance, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', async (request, reply) => {
    const { email, password, displayName } = request.body as any;

    if (!email || !password || !displayName) {
      return reply.status(400).send({ message: 'Données manquantes' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return reply.status(400).send({ message: 'Format email invalide' });
    }

    if (password.length < 8) {
      return reply.status(400).send({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const existingUser = await server.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ message: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await server.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
      },
    });

    const token = server.jwt.sign({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        nativeLang: user.nativeLang,
        targetLang: user.targetLang,
        avatarUrl: user.avatarUrl,
      },
    };
  });

  server.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ message: 'Données manquantes' });
    }

    const user = await server.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ message: 'Identifiants invalides' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ message: 'Identifiants invalides' });
    }

    const token = server.jwt.sign({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        nativeLang: user.nativeLang,
        targetLang: user.targetLang,
        avatarUrl: user.avatarUrl,
      },
    };
  });

  server.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string; email: string };
    const user = await server.prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return reply.status(401).send({ message: 'Utilisateur introuvable' });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      nativeLang: user.nativeLang,
      targetLang: user.targetLang,
      avatarUrl: user.avatarUrl,
    };
  });

  server.put('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string; email: string };
    const { displayName, nativeLang, targetLang } = request.body as any;

    const user = await server.prisma.user.update({
      where: { id: decoded.id },
      data: {
        ...(displayName && { displayName }),
        ...(nativeLang && { nativeLang }),
        ...(targetLang && { targetLang }),
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      nativeLang: user.nativeLang,
      targetLang: user.targetLang,
      avatarUrl: user.avatarUrl,
    };
  });
}
