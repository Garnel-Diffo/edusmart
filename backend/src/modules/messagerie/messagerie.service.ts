import { ApiError } from '@/utils/ApiError';
import { messagerieRepository } from '@/modules/messagerie/messagerie.repository';
import { prisma } from '@/config/prisma';

const HISTORIQUE_TAILLE = 100; // UC19 NFR : "les 100 derniers messages sont chargés à l'ouverture d'un canal"

export const messagerieService = {
  async listCanaux(etudiantId: string) {
    // Cherche l'inscription active, sinon la plus récente toutes statuts confondus
    // (étudiant réinscrit ou récemment changé de filière).
    const inscription =
      (await prisma.inscription.findFirst({
        where: { etudiantId, statut: 'ACTIVE' },
        select: { filiereId: true },
      })) ??
      (await prisma.inscription.findFirst({
        where: { etudiantId },
        orderBy: { createdAt: 'desc' },
        select: { filiereId: true },
      }));

    if (!inscription) return [];

    // Backfill : crée les canaux manquants pour chaque module de la filière.
    const modules = await prisma.module.findMany({
      where: { filiereId: inscription.filiereId },
      select: { id: true, nom: true },
    });

    if (modules.length > 0) {
      await Promise.all(
        modules.map((m) =>
          prisma.canalDiscussion.upsert({
            where: { moduleId: m.id },
            update: {},
            create: { moduleId: m.id, nom: `Canal - ${m.nom}` },
          }),
        ),
      );
    }

    // Requête directe sur la filière — évite la double vérification d'inscription.
    return prisma.canalDiscussion.findMany({
      where: { estActif: true, module: { filiereId: inscription.filiereId } },
      include: { module: { select: { id: true, nom: true, code: true } } },
      orderBy: { nom: 'asc' },
    });
  },

  async getHistorique(etudiantId: string, canalId: string) {
    const canal = await messagerieRepository.findCanalById(canalId);
    if (!canal) throw ApiError.notFound('Canal de discussion introuvable');
    if (!canal.estActif) throw ApiError.forbidden('Ce canal de discussion a été désactivé');

    const autorise = await messagerieRepository.etudiantPeutAccederCanal(etudiantId, canalId);
    if (!autorise) throw ApiError.forbidden("Vous n'êtes pas inscrit au module de ce canal");

    const messages = await messagerieRepository.getHistorique(canalId, HISTORIQUE_TAILLE);
    return messages.reverse(); // ordre chronologique pour l'affichage
  },

  async envoyerMessage(etudiantId: string, canalId: string, contenu: string) {
    const texte = contenu.trim();
    if (!texte) throw ApiError.badRequest('Le message ne peut pas être vide'); // UC19 - E1

    const canal = await messagerieRepository.findCanalById(canalId);
    if (!canal) throw ApiError.notFound('Canal de discussion introuvable');
    if (!canal.estActif) throw ApiError.forbidden('Ce canal de discussion a été désactivé'); // UC19 - E2

    const autorise = await messagerieRepository.etudiantPeutAccederCanal(etudiantId, canalId);
    if (!autorise) throw ApiError.forbidden("Vous n'êtes pas inscrit au module de ce canal");

    return messagerieRepository.createMessage(canalId, etudiantId, texte);
  },

  async signalerMessage(etudiantId: string, canalId: string, messageId: string) {
    const autorise = await messagerieRepository.etudiantPeutAccederCanal(etudiantId, canalId);
    if (!autorise) throw ApiError.forbidden("Vous n'êtes pas inscrit au module de ce canal");
    return messagerieRepository.flagMessage(messageId, etudiantId);
  },
};
