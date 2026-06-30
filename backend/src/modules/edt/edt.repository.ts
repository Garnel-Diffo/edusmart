import { prisma } from '@/config/prisma';
import type { JourSemaine } from '@prisma/client';

const seanceInclude = {
  matiere: { select: { id: true, nom: true, code: true } },
  salle: { select: { id: true, nom: true, type: true } },
  enseignant: { select: { utilisateurId: true, utilisateur: { select: { nom: true, prenom: true } } } },
} as const;

interface CreateSeanceInput {
  emploiDuTempsId: string;
  matiereId: string;
  salleId: string;
  enseignantId: string;
  jourSemaine: JourSemaine;
  heureDebut: string;
  heureFin: string;
  typeSeance: 'COURS' | 'TD' | 'TP';
}

export const edtRepository = {
  findEmploiDuTemps(filiereId: string, semestre: number, anneeScolaire: string) {
    return prisma.emploiDuTemps.findUnique({
      where: { filiereId_semestre_anneeScolaire: { filiereId, semestre, anneeScolaire } },
      include: { seances: { include: seanceInclude } },
    });
  },

  createEmploiDuTemps(filiereId: string, semestre: number, anneeScolaire: string, createdById: string) {
    return prisma.emploiDuTemps.create({ data: { filiereId, semestre, anneeScolaire, createdById } });
  },

  findSeancesForEnseignant(enseignantId: string) {
    return prisma.seance.findMany({
      where: { enseignantId },
      include: { ...seanceInclude, emploiDuTemps: { include: { filiere: true } } },
      orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }],
    });
  },

  /** Séances concurrentes pour la même salle ou le même enseignant, sur le même jour (toutes EDT confondus). */
  findConflicts(params: { jourSemaine: JourSemaine; salleId: string; enseignantId: string; excludeSeanceId?: string }) {
    return prisma.seance.findMany({
      where: {
        jourSemaine: params.jourSemaine,
        id: params.excludeSeanceId ? { not: params.excludeSeanceId } : undefined,
        OR: [{ salleId: params.salleId }, { enseignantId: params.enseignantId }],
      },
      include: seanceInclude,
    });
  },

  createSeance(data: CreateSeanceInput) {
    return prisma.seance.create({ data, include: seanceInclude });
  },

  findSeanceById(id: string) {
    return prisma.seance.findUnique({ where: { id }, include: { emploiDuTemps: true } });
  },

  updateSeance(id: string, data: Partial<CreateSeanceInput>) {
    return prisma.seance.update({ where: { id }, data, include: seanceInclude });
  },

  deleteSeance(id: string) {
    return prisma.seance.delete({ where: { id } });
  },
};
