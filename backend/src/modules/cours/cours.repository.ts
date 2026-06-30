import { prisma } from '@/config/prisma';
import type { FormatDocument, Prisma, StatutIndexation } from '@prisma/client';

interface CreateCoursDocumentInput {
  matiereId: string;
  enseignantId: string;
  titre: string;
  nomFichier: string;
  format: FormatDocument;
  tailleOctets: number;
  cloudinaryPublicId: string;
  cloudinaryVersion: number;
  cloudinaryUrl: string;
}

export const coursRepository = {
  findMany(where: Prisma.CoursDocumentWhereInput, skip: number, take: number) {
    return Promise.all([
      prisma.coursDocument.findMany({
        where,
        skip,
        take,
        orderBy: { dateDepot: 'desc' },
        include: { matiere: { include: { module: true } }, enseignant: { include: { utilisateur: true } } },
      }),
      prisma.coursDocument.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.coursDocument.findUnique({
      where: { id },
      include: { matiere: { include: { module: { include: { filiere: true } } } } },
    });
  },

  findByMatiereAndTitre(matiereId: string, nomFichier: string) {
    return prisma.coursDocument.findFirst({ where: { matiereId, nomFichier } });
  },

  create(data: CreateCoursDocumentInput) {
    return prisma.coursDocument.create({ data });
  },

  replace(id: string, data: Partial<CreateCoursDocumentInput>) {
    return prisma.coursDocument.update({ where: { id }, data: { ...data, statutIndexation: 'NON_INDEXE' } });
  },

  updateStatutIndexation(id: string, statut: StatutIndexation) {
    return prisma.coursDocument.update({ where: { id }, data: { statutIndexation: statut } });
  },

  incrementTelechargements(id: string) {
    return prisma.coursDocument.update({ where: { id }, data: { nbTelechargements: { increment: 1 } } });
  },

  createTelechargementLog(coursDocumentId: string, etudiantId: string, ip?: string) {
    return prisma.telechargementLog.create({ data: { coursDocumentId, etudiantId, ip } });
  },

  /** Filière active de l'étudiant (utilisée pour restreindre la visibilité des cours, UC1 NFR "cohérence"). */
  findFiliereActiveEtudiant(etudiantId: string) {
    return prisma.inscription.findFirst({
      where: { etudiantId, statut: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { filiereId: true },
    });
  },
};
