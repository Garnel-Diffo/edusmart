import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const annoncesRepository = {
  findForScope(where: Prisma.AnnonceWhereInput, skip: number, take: number) {
    return Promise.all([
      prisma.annonce.findMany({
        where,
        skip,
        take,
        orderBy: { datePublication: 'desc' },
        include: { auteur: { select: { nom: true, prenom: true, role: true } }, filiere: true, module: true },
      }),
      prisma.annonce.count({ where }),
    ]);
  },

  create(data: Prisma.AnnonceUncheckedCreateInput) {
    return prisma.annonce.create({ data });
  },

  /** Filière(s) de l'étudiant (via ses inscriptions actives). */
  findFiliereIdsEtudiant(etudiantId: string) {
    return prisma.inscription.findMany({ where: { etudiantId, statut: 'ACTIVE' }, select: { filiereId: true } });
  },

  /** Statut délégué + filière active de l'étudiant (UC18 étendu : annonces de classe). */
  async findEtudiantDelegueInfo(etudiantId: string) {
    const etudiant = await prisma.etudiant.findUnique({
      where: { utilisateurId: etudiantId },
      select: { estDelegue: true, inscriptions: { where: { statut: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, select: { filiereId: true }, take: 1 } },
    });
    return { estDelegue: etudiant?.estDelegue ?? false, filiereId: etudiant?.inscriptions[0]?.filiereId ?? null };
  },

  /** Modules et filière(s) couverts par les matières enseignées par l'enseignant. */
  findScopeEnseignant(enseignantId: string) {
    return prisma.matiere.findMany({
      where: { enseignantId },
      select: { module: { select: { id: true, filiereId: true } } },
    });
  },

  /** Étudiants ciblés par une annonce, pour la notification (UC18 - étape 5). */
  findDestinatairesEtudiants(cible: { type: string; filiereId?: string | null; moduleId?: string | null; etudiantCibleId?: string | null }) {
    if (cible.type === 'ETUDIANT' && cible.etudiantCibleId) {
      return prisma.etudiant.findMany({ where: { utilisateurId: cible.etudiantCibleId }, select: { utilisateurId: true } });
    }
    if (cible.type === 'MODULE' && cible.moduleId) {
      return prisma.etudiant.findMany({
        where: { inscriptions: { some: { statut: 'ACTIVE', filiere: { modules: { some: { id: cible.moduleId } } } } } },
        select: { utilisateurId: true },
      });
    }
    if (cible.type === 'FILIERE' && cible.filiereId) {
      return prisma.etudiant.findMany({
        where: { inscriptions: { some: { statut: 'ACTIVE', filiereId: cible.filiereId } } },
        select: { utilisateurId: true },
      });
    }
    return prisma.etudiant.findMany({ select: { utilisateurId: true } });
  },
};
