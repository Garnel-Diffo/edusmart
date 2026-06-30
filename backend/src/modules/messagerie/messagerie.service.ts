import { ApiError } from '@/utils/ApiError';
import { messagerieRepository } from '@/modules/messagerie/messagerie.repository';

const HISTORIQUE_TAILLE = 100; // UC19 NFR : "les 100 derniers messages sont chargés à l'ouverture d'un canal"

export const messagerieService = {
  listCanaux(etudiantId: string) {
    return messagerieRepository.findCanauxForEtudiant(etudiantId);
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
