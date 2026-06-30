import type { TypeFicheIA } from '@prisma/client';
import { iaRepository } from '@/modules/ia/ia.repository';
import { aiServiceClient, isAiServiceUnavailableError } from '@/utils/aiServiceClient';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';
import { notifyUser } from '@/modules/notifications/notifications.service';
import { renderHtmlToPdf } from '@/utils/pdfGenerator';
import { uploadDocumentBuffer } from '@/utils/cloudinaryUpload';
import { fichePdfHtml } from '@/utils/documentTemplates';
import { env } from '@/config/env';

interface UserContext {
  id: string;
  role: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN_SCOLAIRE' | 'DIRECTION' | 'SUPER_ADMIN';
}

async function resoudreFiliere(user: UserContext): Promise<string> {
  if (user.role === 'ENSEIGNANT') {
    const scope = await iaRepository.findFiliereEnseignant(user.id);
    if (!scope) throw ApiError.badRequest("Aucune matière ne vous est affectée, impossible de déterminer le contexte");
    return scope.module.filiereId;
  }
  const inscription = await iaRepository.findFiliereEtudiant(user.id);
  if (!inscription) throw ApiError.badRequest('Aucune inscription active trouvée pour déterminer le contexte');
  return inscription.filiereId;
}

export const iaService = {
  /** UC13 - Interroger le chatbot IA (RAG). */
  async chat(user: UserContext, question: string) {
    const filiereId = await resoudreFiliere(user);
    const debut = Date.now();

    try {
      const reponse = await aiServiceClient.chat({ question, filiereId, utilisateurId: user.id });
      const dureeMs = Date.now() - debut;

      await iaRepository.logInteraction({
        utilisateurId: user.id,
        type: 'CHAT',
        question,
        reponse: reponse.reponse,
        sourcesJson: reponse.sources,
        scoreSimilariteMoyen: reponse.sources.length ? reponse.sources.reduce((a, s) => a + s.score, 0) / reponse.sources.length : undefined,
        dureeMs,
      });

      return reponse;
    } catch (err) {
      if (isAiServiceUnavailableError(err)) {
        throw ApiError.serviceUnavailable('Le service IA est temporairement indisponible, veuillez réessayer plus tard'); // UC13 - 6a
      }
      logger.error({ err }, 'Erreur chatbot IA');
      throw ApiError.internal('Une erreur est survenue lors du traitement de votre question'); // UC13 - E1
    }
  },

  /** UC15 - Recherche sémantique dans les cours, avec repli plein texte si le service IA est indisponible. */
  async search(user: UserContext, requete: string) {
    const filiereId = await resoudreFiliere(user);

    try {
      const resultats = await aiServiceClient.search({ requete, filiereId });
      await iaRepository.logInteraction({ utilisateurId: user.id, type: 'RECHERCHE', question: requete, sourcesJson: resultats });
      return { resultats, modeDegrade: false };
    } catch (err) {
      if (!isAiServiceUnavailableError(err)) throw err;

      logger.warn({ err }, 'Service IA indisponible, repli sur la recherche plein texte (UC15 - E1)');
      const fallback = await iaRepository.fullTextSearchFallback(requete, filiereId);
      return {
        resultats: fallback.map((doc) => ({
          coursDocumentId: doc.id,
          titre: doc.titre,
          extrait: doc.chunks[0]?.contenuTexte?.slice(0, 240) ?? '',
          score: 0,
        })),
        modeDegrade: true,
      };
    }
  },

  /** UC14 - Génère une fiche de révision (traitement asynchrone côté service IA). */
  async demarrerGenerationFiche(
    user: UserContext,
    input: { type: TypeFicheIA; matiereId?: string; moduleId?: string; coursDocumentId?: string },
  ) {
    const fiche = await iaRepository.createFicheRevision({ etudiantId: user.id, ...input });

    try {
      await aiServiceClient.genererFiche({ ficheRevisionId: fiche.id, ...input });
    } catch (err) {
      logger.error({ err, ficheId: fiche.id }, 'Échec du déclenchement de la génération de fiche');
    }

    return fiche;
  },

  async getFiche(id: string, etudiantId: string) {
    const fiche = await iaRepository.findFicheById(id);
    if (!fiche || fiche.etudiantId !== etudiantId) throw ApiError.notFound('Fiche introuvable');
    return fiche;
  },

  /** UC14 - Export PDF à la demande (le contenu texte est généré une fois par le service IA). */
  async exporterFichePdf(id: string, etudiantId: string) {
    const fiche = await this.getFiche(id, etudiantId);
    if (fiche.statut !== 'PRET' || !fiche.contenuGenere) {
      throw ApiError.conflict("La fiche n'est pas encore prête");
    }
    if (fiche.pdfCloudinaryUrl) return fiche.pdfCloudinaryUrl;

    const html = fichePdfHtml({ etablissement: env.ETABLISSEMENT_NOM, type: fiche.type, contenuGenere: fiche.contenuGenere });
    const pdf = await renderHtmlToPdf(html);
    const { secureUrl } = await uploadDocumentBuffer(pdf, `edusmart/fiches/${etudiantId}`, `fiche-${fiche.id}`);
    await iaRepository.updateFicheRevision(fiche.id, { statut: 'PRET', pdfCloudinaryUrl: secureUrl });
    return secureUrl;
  },

  /** Callback interne appelé par le service IA Python à la fin de la génération (UC14 - E1). */
  async traiterCallbackFiche(data: { ficheRevisionId: string; statut: 'PRET' | 'ECHEC'; contenuGenere?: string; pdfCloudinaryUrl?: string }) {
    const fiche = await iaRepository.updateFicheRevision(data.ficheRevisionId, {
      statut: data.statut,
      contenuGenere: data.contenuGenere,
      pdfCloudinaryUrl: data.pdfCloudinaryUrl,
    });

    await notifyUser({
      destinataireId: fiche.etudiantId,
      type: data.statut === 'PRET' ? 'FICHE_PRETE' : 'FICHE_ECHEC',
      titre: data.statut === 'PRET' ? 'Votre fiche de révision est prête' : 'Échec de génération de fiche',
      contenu: data.statut === 'PRET' ? 'Votre fiche de révision a été générée avec succès.' : 'La génération de votre fiche a échoué, veuillez réessayer.',
      lien: `/ia/fiches/${fiche.id}`,
    });

    return fiche;
  },
};
