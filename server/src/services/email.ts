import { Resend } from 'resend';
import { config } from '../config.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

/**
 * Envoie un email via Resend en essayant d'abord le domaine personnalisé (luisbetancourt.fr)
 * puis en basculant automatiquement sur onboarding@resend.dev si le domaine n'est pas encore vérifié.
 */
async function sendWithFallback(params: {
  to: string;
  subject: string;
  html: string;
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
    'WonderWord-UNI <noreply@luisbetancourt.fr>',
    'WonderWord-UNI <noreply@wonderword.luisbetancourt.fr>',
    'WonderWord-UNI <onboarding@resend.dev>',
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  let lastErrorMsg = '';

  for (const fromAddress of candidateSenders) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html,
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
 * (utilisé lors d'une inscription par formulaire OU lors d'une première inscription via Google OAuth)
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
      ? 'Connexion Google OAuth 2.0 vérifiée'
      : 'Inscription par courriel & mot de passe';

  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 34px 26px; background-color: #fbf7ee; border: 1px solid rgba(196, 99, 47, 0.25); border-radius: 18px; color: #241d24;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(36,29,36,0.1); padding-bottom: 18px;">
        <h1 style="color: #53335a; font-size: 28px; margin: 0 0 6px 0; font-family: 'Georgia', serif; font-weight: normal;">WonderWord-UNI</h1>
        <p style="font-size: 11px; color: #006a64; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-weight: bold;">
          Immersion Littéraire &amp; Laboratoire Phonétique · Paris 8
        </p>
      </div>

      <h2 style="color: #241d24; font-size: 21px; font-weight: normal; margin-bottom: 14px;">
        Bienvenue, <strong>${displayName}</strong> !
      </h2>
      
      <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 16px;">
        Nous vous confirmons que votre inscription sur la plateforme <strong>WonderWord-UNI</strong> a bien été enregistrée avec cette adresse courriel.
      </p>

      <!-- Récapitulatif du compte -->
      <div style="background-color: #ffffff; border: 1px solid rgba(36,29,36,0.12); border-left: 4px solid #006a64; border-radius: 12px; padding: 16px 20px; margin: 22px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #241d24;">
        <p style="margin: 0 0 8px 0;"><strong>Nom affiché :</strong> ${displayName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Courriel associé :</strong> ${toEmail}</p>
        <p style="margin: 0;"><strong>Mode d'authentification :</strong> ${methodBadge}</p>
      </div>
      
      <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 26px;">
        ${
          token
            ? 'Cliquez sur le bouton ci-dessous pour confirmer votre adresse courriel et accéder directement à votre Tableau de bord, à la Bibliothèque Littéraire et à l’Atelier de Lecture Critique :'
            : 'Votre compte est actif ! Vous pouvez accéder à tout moment à votre Tableau de bord, à la Bibliothèque Littéraire et à l’Atelier de Lecture Critique :'
        }
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="background-color: #53335a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 8px rgba(83, 51, 90, 0.25);">
          ${token ? 'Confirmer mon inscription &amp; Accéder à WonderWord' : 'Accéder à mon espace WonderWord-UNI'}
        </a>
      </div>

      <p style="font-size: 12px; color: #756a77; line-height: 1.6; border-top: 1px solid rgba(36,29,36,0.1); padding-top: 18px; margin-top: 28px;">
        Lien direct vers la plateforme :<br/>
        <a href="${verifyUrl}" style="color: #006a64; word-break: break-all;">${verifyUrl}</a>
      </p>

      <p style="font-size: 11px; color: #a99fac; text-align: center; margin-top: 22px;">
        Université Paris 8 — Master Humanités Numériques : parcours NET
      </p>
    </div>
  `;

  const result = await sendWithFallback({
    to: toEmail,
    subject: `Bienvenue sur WonderWord-UNI, ${displayName} — Confirmation d'inscription`,
    html,
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

  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fbf7ee; border: 1px solid rgba(196, 99, 47, 0.25); border-radius: 16px; color: #241d24;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #53335a; font-size: 28px; margin: 0 0 6px 0; font-family: 'Georgia', serif;">WonderWord-UNI</h1>
        <p style="font-size: 12px; color: #756a77; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Immersion Littéraire &amp; Laboratoire Phonétique</p>
      </div>

      <h2 style="color: #241d24; font-size: 20px; font-weight: normal; margin-bottom: 12px;">Bonjour ${displayName},</h2>
      
      <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 16px;">
        Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte WonderWord.
      </p>
      
      <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 28px;">
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe (ce lien est valable pendant 1 heure) :
      </p>

      <div style="text-align: center; margin: 36px 0;">
        <a href="${resetUrl}" style="background-color: #c4632f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 8px rgba(196, 99, 47, 0.25);">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <p style="font-size: 12px; color: #756a77; line-height: 1.6; border-top: 1px solid rgba(36,29,36,0.1); padding-top: 20px; margin-top: 32px;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.<br/><br/>
        Lien direct : <a href="${resetUrl}" style="color: #006a64; word-break: break-all;">${resetUrl}</a>
      </p>

      <p style="font-size: 11px; color: #a99fac; text-align: center; margin-top: 24px;">
        Université Paris 8 — Master Humanités Numériques : parcours NET
      </p>
    </div>
  `;

  const result = await sendWithFallback({
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe WonderWord-UNI',
    html,
  });

  return {
    success: result.success,
    resetUrl,
    providerNote: result.providerNote,
  };
}
