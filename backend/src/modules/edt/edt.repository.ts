import { prisma } from '@/config/prisma';

interface UpsertEmploiDuTempsInput {
  filiereId: string;
  semestre: number;
  anneeScolaire: string;
  titre?: string;
  format: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  createdById: string;
}

export const edtRepository = {
  findEmploiDuTemps(filiereId: string, semestre: number, anneeScolaire: string) {
    return prisma.emploiDuTemps.findUnique({
      where: { filiereId_semestre_anneeScolaire: { filiereId, semestre, anneeScolaire } },
    });
  },

  upsert(data: UpsertEmploiDuTempsInput) {
    const { filiereId, semestre, anneeScolaire, ...rest } = data;
    return prisma.emploiDuTemps.upsert({
      where: { filiereId_semestre_anneeScolaire: { filiereId, semestre, anneeScolaire } },
      create: { filiereId, semestre, anneeScolaire, ...rest },
      update: { ...rest },
    });
  },
};
