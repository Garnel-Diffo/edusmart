import { annoncesRepository } from '@/modules/annonces/annonces.repository';
import { ApiError } from '@/utils/ApiError';
import { recordAudit } from '@/utils/audit';
import { notifyManyUsers } from '@/modules/notifications/notifications.service';
import { parsePagination, buildPaginatedResult, type PaginationQuery } from '@/utils/pagination';

interface UserContext {
  id: string;
  role: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN_SCOLAIRE' | 'DIRECTION' | 'SUPER_ADMIN';
}

interface CreateAnnonceInput {
  titre: string;
  contenu: string;
  cible: 'TOUS' | 'FILIERE' | 'MODULE' | 'ETUDIANT';
  filiereId?: string;
  moduleId?: string;
  etudiantCibleId?: string;
}

/** UC18 - E2 : détection naïve de spam (répétitions excessives de caractères). */
function ressembleASpam(texte: string): boolean {
  return /(.)\1{9,}/.test(texte) || /^(.{1,5})\1{6,}$/.test(texte.trim());
}

export const annoncesService = {
  /** UC17 - Consulter les annonces, filtrées selon le rôle et la portée de l'utilisateur. */
  async list(user: UserContext, query: PaginationQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    if (user.role === 'ADMIN_SCOLAIRE' || user.role === 'SUPER_ADMIN' || user.role === 'DIRECTION') {
      const [data, total] = await annoncesRepository.findForScope({}, skip, take);
      return buildPaginatedResult(data, total, page, pageSize);
    }

    if (user.role === 'ETUDIANT') {
      const inscriptions = await annoncesRepository.findFiliereIdsEtudiant(user.id);
      const filiereIds = inscriptions.map((i) => i.filiereId);
      const [data, total] = await annoncesRepository.findForScope(
        {
          OR: [
            { cible: 'TOUS' },
            { cible: 'ETUDIANT', etudiantCibleId: user.id },
            { cible: 'FILIERE', filiereId: { in: filiereIds } },
            { cible: 'MODULE', module: { filiereId: { in: filiereIds } } },
          ],
        },
        skip,
        take,
      );
      return buildPaginatedResult(data, total, page, pageSize);
    }

    // ENSEIGNANT
    const scope = await annoncesRepository.findScopeEnseignant(user.id);
    const moduleIds = scope.map((s) => s.module.id);
    const filiereIds = [...new Set(scope.map((s) => s.module.filiereId))];
    const [data, total] = await annoncesRepository.findForScope(
      { OR: [{ cible: 'TOUS' }, { cible: 'FILIERE', filiereId: { in: filiereIds } }, { cible: 'MODULE', moduleId: { in: moduleIds } }] },
      skip,
      take,
    );
    return buildPaginatedResult(data, total, page, pageSize);
  },

  /** UC18 - Publier une annonce. */
  async publier(auteur: UserContext, input: CreateAnnonceInput) {
    if (ressembleASpam(input.titre) || ressembleASpam(input.contenu)) {
      throw ApiError.badRequest('Le contenu semble contenir des répétitions excessives, veuillez le reformuler'); // UC18 - E2
    }

    if (auteur.role === 'ENSEIGNANT') {
      if (input.cible === 'TOUS' || input.cible === 'ETUDIANT') {
        throw ApiError.forbidden('Un enseignant ne peut cibler que sa filière ou ses modules'); // NFR sécurité UC18
      }
      const scope = await annoncesRepository.findScopeEnseignant(auteur.id);
      const moduleIds = scope.map((s) => s.module.id);
      const filiereIds = scope.map((s) => s.module.filiereId);
      if (input.cible === 'FILIERE' && !filiereIds.includes(input.filiereId!)) {
        throw ApiError.forbidden('Vous ne pouvez cibler que les filières dans lesquelles vous enseignez');
      }
      if (input.cible === 'MODULE' && !moduleIds.includes(input.moduleId!)) {
        throw ApiError.forbidden('Vous ne pouvez cibler que vos propres modules');
      }
    }

    const annonce = await annoncesRepository.create({
      auteurId: auteur.id,
      titre: input.titre,
      contenu: input.contenu,
      cible: input.cible,
      filiereId: input.filiereId,
      moduleId: input.moduleId,
      etudiantCibleId: input.etudiantCibleId,
    });

    await recordAudit({ utilisateurId: auteur.id, action: 'PUBLISH', entite: 'Annonce', entiteId: annonce.id, donneesApres: { titre: input.titre, cible: input.cible } });

    const destinataires = await annoncesRepository.findDestinatairesEtudiants({
      type: input.cible,
      filiereId: input.filiereId,
      moduleId: input.moduleId,
      etudiantCibleId: input.etudiantCibleId,
    });

    await notifyManyUsers(
      destinataires.map((d) => ({
        destinataireId: d.utilisateurId,
        type: 'NOUVELLE_ANNONCE',
        titre: `Nouvelle annonce : ${input.titre}`,
        contenu: input.contenu.slice(0, 200),
        lien: `/annonces/${annonce.id}`,
      })),
    );

    return annonce;
  },
};
