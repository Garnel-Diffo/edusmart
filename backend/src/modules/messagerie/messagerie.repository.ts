import { prisma } from '@/config/prisma';

export const messagerieRepository = {
  /** Canaux des modules pour lesquels l'étudiant a une inscription active. */
  findCanauxForEtudiant(etudiantId: string) {
    return prisma.canalDiscussion.findMany({
      where: {
        estActif: true,
        module: {
          filiere: {
            inscriptions: { some: { etudiantId, statut: 'ACTIVE' } },
          },
        },
      },
      include: { module: { select: { id: true, nom: true, code: true } } },
      orderBy: { nom: 'asc' },
    });
  },

  findCanalById(canalId: string) {
    return prisma.canalDiscussion.findUnique({
      where: { id: canalId },
      include: { module: { include: { filiere: true } } },
    });
  },

  /** Vérifie que l'étudiant est bien inscrit à la filière du module du canal. */
  async etudiantPeutAccederCanal(etudiantId: string, canalId: string): Promise<boolean> {
    const canal = await prisma.canalDiscussion.findUnique({
      where: { id: canalId },
      select: { module: { select: { filiereId: true } } },
    });
    if (!canal) return false;
    const inscription = await prisma.inscription.findFirst({
      where: { etudiantId, filiereId: canal.module.filiereId, statut: 'ACTIVE' },
    });
    return Boolean(inscription);
  },

  getHistorique(canalId: string, limit = 100) {
    return prisma.message.findMany({
      where: { canalId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { auteur: { select: { id: true, nom: true, prenom: true, avatarUrl: true } } },
    });
  },

  createMessage(canalId: string, auteurId: string, contenu: string) {
    return prisma.message.create({
      data: { canalId, auteurId, contenu },
      include: { auteur: { select: { id: true, nom: true, prenom: true, avatarUrl: true } } },
    });
  },

  flagMessage(messageId: string, signaleParId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { estSignale: true, signaleParId },
    });
  },
};
