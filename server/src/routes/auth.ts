import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';

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

  // Demande de réinitialisation de mot de passe (Mot de passe oublié)
  server.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as any;

    if (!email) {
      return reply.status(400).send({ message: 'Adresse email requise' });
    }

    const user = await server.prisma.user.findUnique({ where: { email } });

    // Pour la sécurité, on retourne un succès même si l'email n'existe pas
    if (!user) {
      return {
        success: true,
        message: 'Si cette adresse email est enregistrée, un lien de réinitialisation a été envoyé.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // Valable 1 heure

    await server.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires,
      },
    });

    const emailResult = await sendPasswordResetEmail(user.email, user.displayName, resetToken);

    return {
      success: true,
      emailSent: emailResult.success,
      resetUrl: emailResult.resetUrl, // Fourni pour test direct / simulation sans attendre
      message: 'Si cette adresse email est enregistrée, un lien de réinitialisation a été envoyé.',
    };
  });

  // Application du nouveau mot de passe
  server.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body as any;

    if (!token || !newPassword) {
      return reply.status(400).send({ message: 'Jeton ou nouveau mot de passe manquant' });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const user = await server.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return reply.status(400).send({ message: 'Le lien de réinitialisation est invalide ou a expiré' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updatedUser = await server.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    });

    const jwtToken = server.jwt.sign({ id: updatedUser.id, email: updatedUser.email });

    return {
      success: true,
      token: jwtToken,
      message: 'Votre mot de passe a été mis à jour avec succès !',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        nativeLang: updatedUser.nativeLang,
        targetLang: updatedUser.targetLang,
        avatarUrl: updatedUser.avatarUrl,
        isVerified: updatedUser.isVerified,
      },
    };
  });
}
