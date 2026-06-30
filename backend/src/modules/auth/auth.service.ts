import dayjs from 'dayjs';
import type { Utilisateur } from '@prisma/client';
import { authRepository } from '@/modules/auth/auth.repository';
import { ApiError } from '@/utils/ApiError';
import { comparePassword, hashPassword } from '@/utils/password';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '@/utils/jwt';
import { env } from '@/config/env';
import { recordAudit } from '@/utils/audit';
import { sendEmail } from '@/config/brevo';
import { passwordResetEmail } from '@/utils/emailTemplates';
import { logger } from '@/config/logger';

export interface AuthMeta {
  ip?: string;
  userAgent?: string;
}

function sanitizeUser(user: Utilisateur & Record<string, unknown>) {
  const { motDePasseHash: _motDePasseHash, ...safe } = user;
  return safe;
}

async function issueTokenPair(user: Utilisateur, meta: AuthMeta) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken, hash } = generateRefreshToken();
  await authRepository.createRefreshToken({
    utilisateurId: user.id,
    tokenHash: hash,
    expiresAt: refreshTokenExpiryDate(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });
  return { accessToken, refreshToken };
}

export const authService = {
  /** UC0 - Se connecter */
  async login(email: string, motDePasse: string, meta: AuthMeta) {
    const user = await authRepository.findByEmail(email);

    // Message générique volontairement identique, que l'email existe ou non (UC0 - 3a).
    const invalidCredentialsError = ApiError.unauthorized('Email ou mot de passe incorrect');

    if (!user) {
      throw invalidCredentialsError;
    }

    if (user.statutCompte === 'DESACTIVE') {
      throw ApiError.forbidden("Ce compte a été désactivé. Veuillez contacter l'administration."); // UC0 - 3b
    }

    if (user.verrouilleJusquA && dayjs(user.verrouilleJusquA).isAfter(dayjs())) {
      const minutesRestantes = dayjs(user.verrouilleJusquA).diff(dayjs(), 'minute') + 1;
      throw ApiError.forbidden(
        `Compte temporairement verrouillé suite à plusieurs échecs de connexion. Réessayez dans ${minutesRestantes} minute(s).`,
      ); // UC0 - 3c
    }

    const motDePasseValide = await comparePassword(motDePasse, user.motDePasseHash);
    if (!motDePasseValide) {
      const updated = await authRepository.incrementFailedAttempts(user.id);
      if (updated.tentativesEchouees >= env.MAX_LOGIN_ATTEMPTS) {
        const until = dayjs().add(env.LOCKOUT_DURATION_MINUTES, 'minute').toDate();
        await authRepository.lockAccount(user.id, until);
        await recordAudit({ utilisateurId: user.id, action: 'COMPTE_VERROUILLE', entite: 'Utilisateur', entiteId: user.id, ip: meta.ip });
      }
      throw invalidCredentialsError;
    }

    await authRepository.resetFailedAttemptsAndUnlock(user.id);
    const tokens = await issueTokenPair(user, meta);
    await recordAudit({ utilisateurId: user.id, action: 'LOGIN_SUCCESS', entite: 'Utilisateur', entiteId: user.id, ip: meta.ip });

    return { ...tokens, user: sanitizeUser(user) };
  },

  /** Rotation du refresh token (cookie HttpOnly) */
  async refresh(rawRefreshToken: string, meta: AuthMeta) {
    const hash = hashRefreshToken(rawRefreshToken);
    const stored = await authRepository.findRefreshTokenByHash(hash);

    if (!stored || stored.revoked || dayjs(stored.expiresAt).isBefore(dayjs())) {
      throw ApiError.unauthorized('Session expirée, veuillez vous reconnecter'); // UC0 - E2
    }

    const user = await authRepository.findById(stored.utilisateurId);
    if (!user || user.statutCompte !== 'ACTIF') {
      throw ApiError.unauthorized('Compte indisponible');
    }

    await authRepository.revokeRefreshToken(hash);
    const tokens = await issueTokenPair(user, meta);
    return { ...tokens, user: sanitizeUser(user) };
  },

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    await authRepository.revokeRefreshToken(hashRefreshToken(rawRefreshToken));
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return sanitizeUser(user);
  },

  /** Déclenche l'envoi d'un lien de réinitialisation (réponse toujours neutre,
   *  pour ne pas révéler si l'email existe en base). */
  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) return;

    const token = signPasswordResetToken(user.id);
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    const { subject, html } = passwordResetEmail({ prenom: user.prenom, resetUrl });

    const sent = await sendEmail({ to: [{ email: user.email, name: `${user.prenom} ${user.nom}` }], subject, htmlContent: html });
    if (!sent) logger.warn({ userId: user.id }, "Email de réinitialisation non envoyé (échec Brevo)");
  },

  async resetPassword(token: string, nouveauMotDePasse: string) {
    let userId: string;
    try {
      userId = verifyPasswordResetToken(token).sub;
    } catch {
      throw ApiError.badRequest('Lien de réinitialisation invalide ou expiré');
    }

    const hash = await hashPassword(nouveauMotDePasse);
    await authRepository.updatePassword(userId, hash);
    await authRepository.revokeAllRefreshTokensForUser(userId);
    await recordAudit({ utilisateurId: userId, action: 'PASSWORD_RESET', entite: 'Utilisateur', entiteId: userId });
  },

  async updateAvatar(userId: string, avatarUrl: string) {
    const updated = await authRepository.updateAvatar(userId, avatarUrl);
    return sanitizeUser(updated);
  },

  async changePassword(userId: string, ancienMotDePasse: string, nouveauMotDePasse: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');

    const valide = await comparePassword(ancienMotDePasse, user.motDePasseHash);
    if (!valide) throw ApiError.badRequest('Ancien mot de passe incorrect');

    const hash = await hashPassword(nouveauMotDePasse);
    await authRepository.updatePassword(userId, hash);
    await recordAudit({ utilisateurId: userId, action: 'PASSWORD_CHANGE', entite: 'Utilisateur', entiteId: userId });
  },
};
