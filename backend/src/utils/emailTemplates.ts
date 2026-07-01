const BRAND_COLOR = '#1F4E79';

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:${BRAND_COLOR};padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">EduSmart</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.6;">
                <h2 style="margin-top:0;color:${BRAND_COLOR};font-size:18px;">${title}</h2>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f4f6f8;color:#7a7a7a;font-size:12px;">
                EduSmart - Plateforme de gestion scolaire intelligente. Cet email est automatique, merci de ne pas y répondre.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeAccountEmail(params: {
  nom: string;
  prenom: string;
  email: string;
  motDePasseTemporaire: string;
  loginUrl: string;
}): { subject: string; html: string } {
  const html = layout(
    'Bienvenue sur EduSmart',
    `<p>Bonjour ${params.prenom} ${params.nom},</p>
     <p>Votre compte EduSmart a été créé par l'administration. Voici vos identifiants de connexion :</p>
     <p style="background:#f4f6f8;border-radius:8px;padding:12px 16px;">
        <strong>Email :</strong> ${params.email}<br/>
        <strong>Mot de passe temporaire :</strong> ${params.motDePasseTemporaire}
     </p>
     <p>Nous vous recommandons de le modifier dès votre première connexion.</p>
     <p><a href="${params.loginUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Se connecter</a></p>`,
  );
  return { subject: 'Votre compte EduSmart a été créé', html };
}

export function passwordResetEmail(params: { prenom: string; resetUrl: string }): {
  subject: string;
  html: string;
} {
  const html = layout(
    'Réinitialisation de mot de passe',
    `<p>Bonjour ${params.prenom},</p>
     <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte EduSmart.</p>
     <p><a href="${params.resetUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
     <p>Ce lien est valable 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  );
  return { subject: 'Réinitialisation de votre mot de passe EduSmart', html };
}

export function genericNotificationEmail(params: { prenom: string; titre: string; contenu: string; lien?: string }): {
  subject: string;
  html: string;
} {
  const html = layout(
    params.titre,
    `<p>Bonjour ${params.prenom},</p>
     <p>${params.contenu}</p>
     ${params.lien ? `<p><a href="${params.lien}" style="color:${BRAND_COLOR};">Voir sur EduSmart →</a></p>` : ''}`,
  );
  return { subject: params.titre, html };
}
