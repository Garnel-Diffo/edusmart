import { prisma } from '@/config/prisma';
import type { FormatDocumentPersonnel, StatutIndexation } from '@prisma/client';

interface CreateDocumentPersonnelInput {
  etudiantId: string;
  titre: string;
  nomFichier: string;
  format: FormatDocumentPersonnel;
  tailleOctets: number;
  cloudinaryPublicId: string;
  cloudinaryVersion: number;
  cloudinaryUrl: string;
}

export const documentsPersonnelsRepository = {
  findManyForEtudiant(etudiantId: string) {
    return prisma.documentPersonnel.findMany({ where: { etudiantId }, orderBy: { createdAt: 'desc' } });
  },

  findById(id: string) {
    return prisma.documentPersonnel.findUnique({ where: { id } });
  },

  create(data: CreateDocumentPersonnelInput) {
    return prisma.documentPersonnel.create({ data });
  },

  updateStatutIndexation(id: string, statut: StatutIndexation) {
    return prisma.documentPersonnel.update({ where: { id }, data: { statutIndexation: statut } });
  },
};
