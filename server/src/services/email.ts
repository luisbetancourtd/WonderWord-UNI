import { Resend } from 'resend';
import crypto from 'node:crypto';
import { config } from '../config.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

/**
 * Envoie un email transactionnel optimisé anti-spam (Multipart HTML + Texte brut,
 * expéditeur humain non-noreply, Reply-To valide et en-tête X-Entity-Ref-ID).
 */
async function sendWithFallback(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; providerNote?: string }> {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY non configurée, email simulé.');
    return { success: false, providerNote: 'RESEND_API_KEY non configurée' };
  }

  const customEnvFrom =
    process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes('resend.dev')
      ? process.env.RESEND_FROM_EMAIL
      : undefined;

  const candidateSenders = [
    customEnvFrom,
    'WonderWord Paris 8 <bonjour@luisbetancourt.fr>',
    'WonderWord Paris 8 <contact@luisbetancourt.fr>',
    'WonderWord-UNI <onboarding@resend.dev>',
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  let lastErrorMsg = '';

  for (const fromAddress of candidateSenders) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: [params.to],
        replyTo: 'luisbetdiaz@gmail.com',
        subject: params.subject,
        html: params.html,
        text: params.text,
        headers: {
          'X-Entity-Ref-ID': crypto.randomUUID(),
        },
      });

      if (!error) {
        console.log(`📧 Email envoyé avec succès à ${params.to} via ${fromAddress}`);
        return { success: true, providerNote: `Envoyé via ${fromAddress}` };
      }

      lastErrorMsg = error.message || JSON.stringify(error);
      console.warn(`⚠️ Tentative Resend avec ${fromAddress} échouée:`, lastErrorMsg);
    } catch (err: any) {
      lastErrorMsg = err?.message || String(err);
      console.error(`Exception Resend avec ${fromAddress}:`, lastErrorMsg);
    }
  }

  return { success: false, providerNote: lastErrorMsg };
}

/**
 * Email de notification d'inscription et de confirmation de compte
 * Optimisé pour la délivrabilité en boîte principale (Outlook / Gmail)
 */
export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  token?: string | null,
  authMethod: 'email' | 'google' = 'email'
): Promise<{ success: boolean; verifyUrl: string; providerNote?: string }> {
  const verifyUrl = token
    ? `${config.appUrl}/?verify_token=${token}`
    : config.appUrl;

  const methodBadge =
    authMethod === 'google'
      ? 'Connexion Google OAuth 2.0'
      : 'Inscription directe par courriel';

  const text = [
    `Bonjour ${displayName},`,
    '',
    `Votre compte sur la plateforme universitaire WonderWord-UNI (Master Humanités Numériques - Université Paris 8) a bien été créé.`,
    '',
    `Récapitulatif de votre inscription :`,
    `- Nom affiché : ${displayName}`,
    `- Courriel : ${toEmail}`,
    `- Méthode d'accès : ${methodBadge}`,
    '',
    token
      ? `Pour confirmer votre adresse courriel et accéder à votre Tableau de bord, ouvrez ce lien :`
      : `Accédez directement à votre espace de lecture sur :`,
    verifyUrl,
    '',
    `Bonne lecture,`,
    `Luis Betancourt — WonderWord-UNI (Université Paris 8)`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre compte WonderWord-UNI</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f7f4ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #241d24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4decb; border-radius: 14px; padding: 32px 28px;">
    <tr>
      <td>
        <p style="font-size: 11px; color: #006a64; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0; font-weight: 700;">
          Université Paris 8 · Master Humanités Numériques
        </p>
        <h1 style="color: #53335a; font-size: 24px; margin: 0 0 20px 0; font-family: Georgia, serif; font-weight: normal;">
          WonderWord-UNI
        </h1>

        <p style="font-size: 15px; color: #241d24; line-height: 1.6; margin: 0 0 14px 0;">
          Bonjour <strong>${displayName}</strong>,
        </p>

        <p style="font-size: 15px; color: #4f4550; line-height: 1.6; margin: 0 0 18px 0;">
          Nous vous confirmons que votre compte sur la plateforme <strong>WonderWord-UNI</strong> a bien été enregistré.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fbf7ee; border-left: 4px solid #006a64; border-radius: 8px; padding: 14px 18px; margin: 0 0 22px 0; font-size: 13.5px; color: #241d24;">
          <tr>
            <td>
              <p style="margin: 0 0 6px 0;"><strong>Nom affiché :</strong> ${displayName}</p>
              <p style="margin: 0 0 6px 0;"><strong>Courriel associé :</strong> ${toEmail}</p>
              <p style="margin: 0;"><strong>Authentification :</strong> ${methodBadge}</p>
            </td>
          </tr>
        </table>

        <p style="font-size: 14.5px; color: #4f4550; line-height: 1.6; margin: 0 0 24px 0;">
          ${
            token
              ? 'Utilisez le bouton ci-dessous pour valider votre adresse courriel et ouvrir votre Tableau de bord :'
              : 'Vous pouvez accéder dès maintenant à votre Tableau de bord et à l’Atelier de Lecture :'
          }
        </p>

        <p style="margin: 0 0 26px 0;">
          <a href="${verifyUrl}" style="background-color: #53335a; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px; display: inline-block;">
            ${token ? 'Valider mon compte WonderWord' : 'Ouvrir mon espace WonderWord'}
          </a>
        </p>

        <p style="font-size: 12px; color: #756a77; line-height: 1.5; border-top: 1px solid #ece6d8; padding-top: 16px; margin: 0;">
          Projet académique WonderWord-UNI · <a href="${config.appUrl}" style="color: #006a64; text-decoration: underline;">wonderword.luisbetancourt.fr</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const result = await sendWithFallback({
    to: toEmail,
    subject: `Votre compte WonderWord-UNI (${displayName})`,
    html,
    text,
  });

  return {
    success: result.success,
    verifyUrl,
    providerNote: result.providerNote,
  };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<{ success: boolean; resetUrl: string; providerNote?: string }> {
  const resetUrl = `${config.appUrl}/?reset_token=${token}`;

  const text = [
    `Bonjour ${displayName},`,
    '',
    `Vous avez demandé la réinitialisation du mot de passe de votre compte WonderWord-UNI.`,
    `Pour choisir un nouveau mot de passe (lien valable 1 heure), ouvrez ce lien :`,
    resetUrl,
    '',
    `Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.`,
    `WonderWord-UNI (Université Paris 8)`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation de mot de passe WonderWord-UNI</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f7f4ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #241d24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4decb; border-radius: 14px; padding: 32px 28px;">
    <tr>
      <td>
        <p style="font-size: 11px; color: #c4632f; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0; font-weight: 700;">
          Sécurité du compte · WonderWord-UNI
        </p>
        <h1 style="color: #53335a; font-size: 22px; margin: 0 0 18px 0; font-family: Georgia, serif; font-weight: normal;">
          Nouveau mot de passe
        </h1>

        <p style="font-size: 15px; color: #241d24; line-height: 1.6; margin: 0 0 14px 0;">
          Bonjour <strong>${displayName}</strong>,
        </p>

        <p style="font-size: 14.5px; color: #4f4550; line-height: 1.6; margin: 0 0 22px 0;">
          Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe pour votre compte WonderWord-UNI (ce lien est valable pendant 60 minutes) :
        </p>

        <p style="margin: 0 0 24px 0;">
          <a href="${resetUrl}" style="background-color: #c4632f; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px; display: inline-block;">
            Choisir mon nouveau mot de passe
          </a>
        </p>

        <p style="font-size: 12px; color: #756a77; line-height: 1.5; border-top: 1px solid #ece6d8; padding-top: 16px; margin: 0;">
          Si vous n'avez pas demandé cette modification, aucune action n'est requise.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const result = await sendWithFallback({
    to: toEmail,
    subject: `Nouveau mot de passe WonderWord-UNI`,
    html,
    text,
  });

  return {
    success: result.success,
    resetUrl,
    providerNote: result.providerNote,
  };
}
