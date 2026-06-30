import { prisma } from '@/config/prisma';
import type { TypeFicheIA, TypeInteractionIA } from '@prisma/client';

export const iaRepository = {
  findFiliereEtudiant(etudiantId: string) {
    return prisma.inscription.findFirst({ where: { etudiantId, statut: 'ACTIVE' }, select: { filiereId: true } });
  },

  findFiliereEnseignant(enseignantId: string) {
    return prisma.matiere.findFirst({ where: { enseignantId }, select: { module: { select: { filiereId: true } } } });
  },

  logInteraction(data: {
    utilisateurId: string;
    type: TypeInteractionIA;
    question?: string;
    reponse?: string;
    sourcesJson?: unknown;
    scoreSimilariteMoyen?: number;
    dureeMs?: number;
  }) {
    return prisma.interactionIA.create({ data: data as never });
  },

  createFicheRevision(data: {
    etudiantId: string;
    type: TypeFicheIA;
    matiereId?: string;
    moduleId?: string;
    coursDocumentId?: string;
    documentPersonnelId?: string;
  }) {
    return prisma.ficheRevision.create({ data });
  },

  findFicheById(id: string) {
    return prisma.ficheRevision.findUnique({ where: { id } });
  },

  updateFicheRevision(id: string, data: { statut: 'PRET' | 'ECHEC'; contenuGenere?: string; pdfCloudinaryUrl?: string }) {
    return prisma.ficheRevision.update({ where: { id }, data: { ...data, genereLe: new Date() } });
  },

  /** Recherche plein texte de repli si le service IA est indisponible (UC15 - E1). */
  fullTextSearchFallback(requete: string, filiereId: string) {
    return prisma.coursDocument.findMany({
      where: {
        matiere: { module: { filiereId } },
        OR: [{ titre: { contains: requete, mode: 'insensitive' } }, { chunks: { some: { contenuTexte: { contains: requete, mode: 'insensitive' } } } }],
      },
      take: 10,
      include: { chunks: { where: { contenuTexte: { contains: requete, mode: 'insensitive' } }, take: 1 } },
    });
  },
};
