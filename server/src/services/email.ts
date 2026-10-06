import { Resend } from 'resend';
import { config } from '../config.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<{ success: boolean; verifyUrl: string }> {
  const verifyUrl = `${config.appUrl}/?verify_token=${token}`;

  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY non configurée, email simulé.');
    return { success: false, verifyUrl };
  }

  try {
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: [toEmail],
      subject: 'Confirmation de votre compte WonderWord-UNI',
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fbf7ee; border: 1px solid rgba(196, 99, 47, 0.25); border-radius: 16px; color: #241d24;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #53335a; font-size: 28px; margin: 0 0 6px 0; font-family: 'Georgia', serif;">WonderWord-UNI</h1>
            <p style="font-size: 12px; color: #756a77; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Immersion Littéraire & Laboratoire Phonétique</p>
          </div>

          <h2 style="color: #241d24; font-size: 20px; font-weight: normal; margin-bottom: 12px;">Bonjour ${displayName},</h2>
          
          <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 16px;">
            Bienvenue dans le laboratoire de lecture augmentée et d'analyse phonétique de l'Université Paris 8.
          </p>
          
          <p style="font-size: 15px; color: #4f4550; line-height: 1.7; margin-bottom: 28px;">
            Pour activer votre carnet d'apprentissage personnel et synchroniser vos progrès littéraires, veuillez confirmer votre adresse email :
          </p>

          <div style="text-align: center; margin: 36px 0;">
            <a href="${verifyUrl}" style="background-color: #53335a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 8px rgba(83, 51, 90, 0.25);">
              Confirmer mon compte
            </a>
          </div>

          <p style="font-size: 12px; color: #756a77; line-height: 1.6; border-top: 1px solid rgba(36,29,36,0.1); padding-top: 20px; margin-top: 32px;">
            Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier et coller ce lien direct dans votre navigateur :<br/>
            <a href="${verifyUrl}" style="color: #006a64; word-break: break-all;">${verifyUrl}</a>
          </p>

          <p style="font-size: 11px; color: #a99fac; text-align: center; margin-top: 24px;">
            Université Paris 8 — Master Humanités Numériques : parcours NET
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur retournée par Resend:', error);
      return { success: false, verifyUrl };
    }

    return { success: true, verifyUrl };
  } catch (err) {
    console.error("Exception lors de l'envoi de l'email via Resend:", err);
    return { success: false, verifyUrl };
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<{ success: boolean; resetUrl: string }> {
  const resetUrl = `${config.appUrl}/?reset_token=${token}`;

  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY non configurée, email réinitialisation simulé.');
    return { success: false, resetUrl };
  }

  try {
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: [toEmail],
      subject: 'Réinitialisation de votre mot de passe WonderWord-UNI',
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fbf7ee; border: 1px solid rgba(196, 99, 47, 0.25); border-radius: 16px; color: #241d24;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #53335a; font-size: 28px; margin: 0 0 6px 0; font-family: 'Georgia', serif;">WonderWord-UNI</h1>
            <p style="font-size: 12px; color: #756a77; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Immersion Littéraire & Laboratoire Phonétique</p>
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
      `,
    });

    if (error) {
      console.error('Erreur Resend mot de passe oublié:', error);
      return { success: false, resetUrl };
    }

    return { success: true, resetUrl };
  } catch (err) {
    console.error("Exception lors de l'envoi de l'email via Resend:", err);
    return { success: false, resetUrl };
  }
}

