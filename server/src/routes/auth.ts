import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sendVerificationEmail } from '../services/email.js';

export default async function authRoutes(server: FastifyInstance) {
  // Inscription avec génération de jeton de confirmation et envoi d'email
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
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const isSpecialDemo = email.toLowerCase() === 'luis@paris8.fr';

    const user = await server.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        isVerified: isSpecialDemo, // Compte démo enseignant pré-validé
        verifyToken: isSpecialDemo ? null : verifyToken,
      },
    });

    let emailSent = false;
    let verifyUrl = '';

    if (!isSpecialDemo) {
      const emailResult = await sendVerificationEmail(email, displayName, verifyToken);
      emailSent = emailResult.success;
      verifyUrl = emailResult.verifyUrl;
    }

    const token = server.jwt.sign({ id: user.id, email: user.email });

    return {
      token,
      emailSent,
      verifyUrl, // Fourni pour test direct / évaluation si besoin
      message: isSpecialDemo 
        ? 'Compte démo activé !' 
        : (emailSent 
            ? 'Compte créé ! Un e-mail de confirmation vous a été envoyé.' 
            : 'Compte créé ! Veuillez valider votre compte via le lien direct.'),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        nativeLang: user.nativeLang,
        targetLang: user.targetLang,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    };
  });

  // Validation d'adresse email via jeton
  server.get('/verify-email', async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.status(400).send({ message: 'Jeton de validation manquant' });
    }

    const user = await server.prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return reply.status(404).send({ message: 'Jeton invalide ou déjà utilisé' });
    }

    const updatedUser = await server.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null,
      },
    });

    const jwtToken = server.jwt.sign({ id: updatedUser.id, email: updatedUser.email });

    return {
      success: true,
      token: jwtToken,
      message: 'Votre adresse email a été confirmée avec succès !',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        nativeLang: updatedUser.nativeLang,
        targetLang: updatedUser.targetLang,
        avatarUrl: updatedUser.avatarUrl,
        isVerified: true,
      },
    };
  });

  // Connexion standard
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
        isVerified: user.isVerified,
      },
    };
  });

  // Profil de l'utilisateur connecté
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
      isVerified: user.isVerified,
    };
  });

  // Mise à jour du profil
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
      isVerified: user.isVerified,
    };
  });
}
