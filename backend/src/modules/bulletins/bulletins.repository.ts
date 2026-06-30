import { prisma } from '@/config/prisma';
import type { Mention } from '@prisma/client';

export const bulletinsRepository = {
  findFiliere(filiereId: string) {
    return prisma.filiere.findUnique({ where: { id: filiereId }, include: { modules: { include: { matieres: true } } } });
  },

  findEtudiantsActifs(filiereId: string, anneeScolaire: string) {
    return prisma.etudiant.findMany({
      where: { inscriptions: { some: { filiereId, anneeScolaire, statut: 'ACTIVE' } } },
      include: { utilisateur: { select: { nom: true, prenom: true } } },
    });
  },

  /** Vérifie qu'il ne reste aucune note non validée pour les matières de la filière/semestre (UC11 - 3a). */
  findMatieresAvecNotesNonValidees(filiereId: string, semestre: number, anneeScolaire: string) {
    return prisma.matiere.findMany({
      where: {
        module: { filiereId },
        notes: { some: { semestre, anneeScolaire, estValide: false } },
      },
      select: { id: true, nom: true },
    });
  },

  upsertBulletin(data: {
    etudiantId: string;
    semestre: number;
    anneeScolaire: string;
    moyenneGenerale: number;
    rang: number;
    mention: Mention;
    pdfCloudinaryUrl: string;
    genereParId: string;
  }) {
    return prisma.bulletinSemestre.upsert({
      where: { etudiantId_semestre_anneeScolaire: { etudiantId: data.etudiantId, semestre: data.semestre, anneeScolaire: data.anneeScolaire } },
      create: data,
      update: data,
    });
  },

  upsertPV(data: {
    filiereId: string;
    niveau: string;
    semestre: number;
    anneeScolaire: string;
    pdfCloudinaryUrl: string;
    decisionsJson: unknown;
    genereParId: string;
    archiveJusquA: Date;
  }) {
    return prisma.pVDeliberation.upsert({
      where: {
        filiereId_niveau_semestre_anneeScolaire: {
          filiereId: data.filiereId,
          niveau: data.niveau,
          semestre: data.semestre,
          anneeScolaire: data.anneeScolaire,
        },
      },
      create: data as never,
      update: data as never,
    });
  },
};
