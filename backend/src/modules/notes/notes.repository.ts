import { prisma } from '@/config/prisma';
import type { TypeEvaluation } from '@prisma/client';

export const notesRepository = {
  findMatiereAvecModule(matiereId: string) {
    return prisma.matiere.findUnique({ where: { id: matiereId }, include: { module: { include: { filiere: true } } } });
  },

  /** Étudiants inscrits (actifs) à la filière du module portant la matière. */
  findEtudiantsInscritsPourMatiere(matiereId: string) {
    return prisma.etudiant.findMany({
      where: {
        inscriptions: {
          some: { statut: 'ACTIVE', filiere: { modules: { some: { matieres: { some: { id: matiereId } } } } } },
        },
      },
      include: { utilisateur: { select: { nom: true, prenom: true } } },
    });
  },

  findExistingNote(etudiantId: string, matiereId: string, typeEvaluation: TypeEvaluation, semestre: number, anneeScolaire: string) {
    return prisma.note.findUnique({
      where: { etudiantId_matiereId_typeEvaluation_semestre_anneeScolaire: { etudiantId, matiereId, typeEvaluation, semestre, anneeScolaire } },
    });
  },

  upsertNote(params: {
    etudiantId: string;
    matiereId: string;
    typeEvaluation: TypeEvaluation;
    semestre: number;
    anneeScolaire: string;
    valeur: number;
    coefficientEvaluation: number;
    saisieParId: string;
  }) {
    return prisma.note.upsert({
      where: {
        etudiantId_matiereId_typeEvaluation_semestre_anneeScolaire: {
          etudiantId: params.etudiantId,
          matiereId: params.matiereId,
          typeEvaluation: params.typeEvaluation,
          semestre: params.semestre,
          anneeScolaire: params.anneeScolaire,
        },
      },
      create: { ...params, estValide: false },
      update: { valeur: params.valeur, coefficientEvaluation: params.coefficientEvaluation, estValide: false, dateSaisie: new Date() },
    });
  },

  findNotesPourValidation(matiereId: string, semestre: number, anneeScolaire: string) {
    return prisma.note.findMany({
      where: { matiereId, semestre, anneeScolaire },
      include: { etudiant: { include: { utilisateur: { select: { nom: true, prenom: true } } } } },
    });
  },

  validerNotes(matiereId: string, semestre: number, anneeScolaire: string, adminId: string) {
    return prisma.note.updateMany({
      where: { matiereId, semestre, anneeScolaire, estValide: false },
      data: { estValide: true, valideParId: adminId, dateValidation: new Date() },
    });
  },

  /** Toutes les notes validées d'un étudiant pour un semestre, avec coefficient et ECTS de la matière. */
  findNotesValideesEtudiant(etudiantId: string, semestre: number, anneeScolaire: string) {
    return prisma.note.findMany({
      where: { etudiantId, semestre, anneeScolaire, estValide: true },
      include: { matiere: { select: { id: true, nom: true, code: true, coefficient: true, creditsEcts: true } } },
    });
  },

  /** Toutes les notes (validées) de la promotion (même filière + niveau) pour le classement. */
  findNotesValideesPourPromotion(filiereId: string, semestre: number, anneeScolaire: string) {
    return prisma.note.findMany({
      where: {
        semestre,
        anneeScolaire,
        estValide: true,
        etudiant: { inscriptions: { some: { filiereId, anneeScolaire, statut: 'ACTIVE' } } },
      },
      include: { matiere: { select: { id: true, nom: true, code: true, coefficient: true, creditsEcts: true } } },
    });
  },

  /** Notes saisies par un enseignant pour une session précise (matière+type+semestre+année). */
  findNotesSession(enseignantId: string, matiereId: string, typeEvaluation: TypeEvaluation, semestre: number, anneeScolaire: string) {
    return prisma.note.findMany({
      where: { matiereId, typeEvaluation, semestre, anneeScolaire, saisieParId: enseignantId },
      select: { etudiantId: true, valeur: true, coefficientEvaluation: true, estValide: true, commentaireRefus: true },
    });
  },

  findEnseignantMatiereIds(enseignantId: string) {
    return prisma.matiere.findMany({ where: { enseignantId }, select: { id: true } });
  },

  /** UC10 - étape 2 : sessions de notes en attente, regroupées par matière/semestre/année. */
  async findSessionsEnAttenteValidation() {
    const groupes = await prisma.note.groupBy({
      by: ['matiereId', 'semestre', 'anneeScolaire'],
      where: { estValide: false },
      _count: { _all: true },
    });

    const matiereIds = [...new Set(groupes.map((g) => g.matiereId))];
    const matieres = await prisma.matiere.findMany({
      where: { id: { in: matiereIds } },
      select: { id: true, nom: true, code: true, module: { select: { nom: true, filiere: { select: { nom: true } } } } },
    });
    const matiereParId = new Map(matieres.map((m) => [m.id, m]));

    return groupes.map((g) => ({
      matiereId: g.matiereId,
      semestre: g.semestre,
      anneeScolaire: g.anneeScolaire,
      nbNotesEnAttente: g._count._all,
      matiere: matiereParId.get(g.matiereId),
    }));
  },
};
