import { prisma } from '@/config/prisma';

/** Filière + niveau de l'inscription active, exposés via /auth/me pour l'affichage côté frontend. */
const inscriptionActiveInclude = {
  where: { statut: 'ACTIVE' as const },
  orderBy: { createdAt: 'desc' as const },
  take: 1,
  include: { filiere: true },
};

export const authRepository = {
  findByEmail(email: string) {
    return prisma.utilisateur.findUnique({
      where: { email },
      include: { etudiant: { include: { inscriptions: inscriptionActiveInclude } }, enseignant: true, adminScolaire: true },
    });
  },

  findById(id: string) {
    return prisma.utilisateur.findUnique({
      where: { id },
      include: { etudiant: { include: { inscriptions: inscriptionActiveInclude } }, enseignant: true, adminScolaire: true },
    });
  },

  incrementFailedAttempts(userId: string) {
    return prisma.utilisateur.update({
      where: { id: userId },
      data: { tentativesEchouees: { increment: 1 } },
    });
  },

  lockAccount(userId: string, until: Date) {
    return prisma.utilisateur.update({
      where: { id: userId },
      data: { verrouilleJusquA: until },
    });
  },

  resetFailedAttemptsAndUnlock(userId: string) {
    return prisma.utilisateur.update({
      where: { id: userId },
      data: { tentativesEchouees: 0, verrouilleJusquA: null, derniereConnexion: new Date() },
    });
  },

  updateAvatar(userId: string, avatarUrl: string) {
    return prisma.utilisateur.update({ where: { id: userId }, data: { avatarUrl } });
  },

  updateProfile(userId: string, data: { nom?: string; prenom?: string; telephone?: string }) {
    return prisma.utilisateur.update({ where: { id: userId }, data });
  },

  updatePassword(userId: string, motDePasseHash: string) {
    return prisma.utilisateur.update({
      where: { id: userId },
      data: { motDePasseHash, tentativesEchouees: 0, verrouilleJusquA: null },
    });
  },

  createRefreshToken(data: { utilisateurId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  },

  revokeAllRefreshTokensForUser(utilisateurId: string) {
    return prisma.refreshToken.updateMany({ where: { utilisateurId }, data: { revoked: true } });
  },
};
