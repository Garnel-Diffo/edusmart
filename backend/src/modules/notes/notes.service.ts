import type { TypeEvaluation } from '@prisma/client';
import { notesRepository } from '@/modules/notes/notes.repository';
import { ApiError } from '@/utils/ApiError';
import { calculerMoyennePonderee, calculerClassement } from '@/utils/grading';
import { recordAudit } from '@/utils/audit';
import { notifyUser, notifyManyUsers } from '@/modules/notifications/notifications.service';
import { emitToUser } from '@/sockets/emit';
import { SOCKET_EVENTS } from '@/sockets/rooms';
import { prisma } from '@/config/prisma';

interface SaisirNotesInput {
  matiereId: string;
  typeEvaluation: TypeEvaluation;
  semestre: number;
  anneeScolaire: string;
  coefficientEvaluation: number;
  notes: { etudiantId: string; valeur: number }[];
}

export const notesService = {
  /** Liste des étudiants inscrits à la matière, support de la grille de saisie (UC9 - étape 3). */
  async listEtudiantsPourMatiere(enseignantId: string, matiereId: string) {
    const matiere = await notesRepository.findMatiereAvecModule(matiereId);
    if (!matiere) throw ApiError.notFound('Matière introuvable');
    if (matiere.enseignantId !== enseignantId) {
      throw ApiError.forbidden("Vous n'êtes pas affecté à cette matière");
    }
    return notesRepository.findEtudiantsInscritsPourMatiere(matiereId);
  },

  /** UC9 - Saisir et gérer les notes. */
  async saisir(enseignantId: string, input: SaisirNotesInput) {
    const matiere = await notesRepository.findMatiereAvecModule(input.matiereId);
    if (!matiere) throw ApiError.notFound('Matière introuvable');
    if (matiere.enseignantId !== enseignantId) {
      throw ApiError.forbidden("Vous ne pouvez saisir des notes que pour vos propres matières"); // NFR sécurité UC9
    }

    const resultats = [];
    for (const note of input.notes) {
      const existante = await notesRepository.findExistingNote(
        note.etudiantId,
        input.matiereId,
        input.typeEvaluation,
        input.semestre,
        input.anneeScolaire,
      );
      if (existante?.estValide) {
        throw ApiError.conflict(
          `Les notes de ${input.typeEvaluation} pour cette matière sont déjà validées et ne peuvent plus être modifiées`,
        ); // Intégrité UC9
      }

      const saved = await notesRepository.upsertNote({
        etudiantId: note.etudiantId,
        matiereId: input.matiereId,
        typeEvaluation: input.typeEvaluation,
        semestre: input.semestre,
        anneeScolaire: input.anneeScolaire,
        valeur: note.valeur,
        coefficientEvaluation: input.coefficientEvaluation,
        saisieParId: enseignantId,
      });
      resultats.push(saved);
    }

    await recordAudit({
      utilisateurId: enseignantId,
      action: 'SAISIE_NOTES',
      entite: 'Note',
      entiteId: input.matiereId,
      donneesApres: { nbNotes: resultats.length, typeEvaluation: input.typeEvaluation },
    });

    await this.notifierAdminsNotesEnAttente(input.matiereId, matiere.nom);

    return resultats;
  },

  async notifierAdminsNotesEnAttente(matiereId: string, matiereNom: string) {
    const admins = await prisma.adminScolaire.findMany({ select: { utilisateurId: true } });
    await notifyManyUsers(
      admins.map((a) => ({
        destinataireId: a.utilisateurId,
        type: 'NOTES_A_VALIDER',
        titre: 'Notes en attente de validation',
        contenu: `De nouvelles notes ont été saisies pour la matière "${matiereNom}" et attendent votre validation.`,
        lien: '/admin/notes',
      })),
    );
  },

  /** Retourne les notes saisies par l'enseignant pour une session donnée avec leur statut. */
  async getNotesSession(enseignantId: string, matiereId: string, typeEvaluation: TypeEvaluation, semestre: number, anneeScolaire: string) {
    const matiere = await notesRepository.findMatiereAvecModule(matiereId);
    if (!matiere) throw ApiError.notFound('Matière introuvable');
    if (matiere.enseignantId !== enseignantId) throw ApiError.forbidden("Vous n'êtes pas affecté à cette matière");

    const notes = await notesRepository.findNotesSession(enseignantId, matiereId, typeEvaluation, semestre, anneeScolaire);
    const estValide = notes.length > 0 && notes.every((n) => n.estValide);
    const coefficientEvaluation = notes[0] ? Number(notes[0].coefficientEvaluation) : 1;
    const commentaireRefus = notes.find((n) => n.commentaireRefus)?.commentaireRefus ?? null;

    return {
      notes: notes.map((n) => ({ etudiantId: n.etudiantId, valeur: Number(n.valeur) })),
      estValide,
      coefficientEvaluation,
      commentaireRefus,
    };
  },

  /** UC10 - étape 2 : liste des sessions en attente de validation pour l'admin. */
  listSessionsEnAttenteValidation() {
    return notesRepository.findSessionsEnAttenteValidation();
  },

  /** UC10 - Valider les notes. */
  async valider(adminId: string, matiereId: string, semestre: number, anneeScolaire: string) {
    const notes = await notesRepository.findNotesPourValidation(matiereId, semestre, anneeScolaire);
    if (notes.length === 0) throw ApiError.notFound('Aucune note en attente pour cette matière');

    await notesRepository.validerNotes(matiereId, semestre, anneeScolaire, adminId);
    await recordAudit({ utilisateurId: adminId, action: 'VALIDATION_NOTES', entite: 'Note', entiteId: matiereId, donneesApres: { semestre, anneeScolaire } });

    const etudiantsUniques = [...new Set(notes.map((n) => n.etudiantId))];
    await notifyManyUsers(
      etudiantsUniques.map((etudiantId) => ({
        destinataireId: etudiantId,
        type: 'NOTES_VALIDEES',
        titre: 'Vos notes sont disponibles',
        contenu: 'Des notes viennent d\'être validées et publiées.',
        lien: '/etudiant/notes',
        envoyerEmail: true,
      })),
    );
    etudiantsUniques.forEach((etudiantId) => emitToUser(etudiantId, SOCKET_EVENTS.NOTES_VALIDATED, { matiereId }));

    return { nbNotesValidees: notes.length };
  },

  /** UC10 - 3a : refus de validation avec commentaire à l'enseignant. */
  async refuserValidation(adminId: string, matiereId: string, semestre: number, anneeScolaire: string, commentaire: string) {
    const notes = await notesRepository.findNotesPourValidation(matiereId, semestre, anneeScolaire);
    if (notes.length === 0) throw ApiError.notFound('Aucune note en attente pour cette matière');

    await prisma.note.updateMany({ where: { matiereId, semestre, anneeScolaire, estValide: false }, data: { commentaireRefus: commentaire } });
    await recordAudit({ utilisateurId: adminId, action: 'REFUS_VALIDATION_NOTES', entite: 'Note', entiteId: matiereId, donneesApres: { commentaire } });

    const enseignantId = notes[0]?.saisieParId;
    if (enseignantId) {
      await notifyUser({
        destinataireId: enseignantId,
        type: 'NOTES_REFUSEES',
        titre: 'Correction requise sur des notes saisies',
        contenu: `Vos notes nécessitent une correction : ${commentaire}`,
        lien: `/enseignant/notes?matiereId=${matiereId}`,
        envoyerEmail: true,
      });
    }
  },

  /** UC8 - Consulter ses notes (avec moyennes pondérées et classement dans la promotion). */
  async consulterPourEtudiant(etudiantId: string, semestre: number, anneeScolaire: string) {
    const inscription = await prisma.inscription.findFirst({ where: { etudiantId, anneeScolaire, statut: 'ACTIVE' } });
    if (!inscription) return { matieres: [], moyenneGenerale: 0, rang: null, effectifPromotion: 0 };

    const notesEtudiant = await notesRepository.findNotesValideesEtudiant(etudiantId, semestre, anneeScolaire);
    const parMatiere = groupByMatiere(notesEtudiant);

    const matieres = Object.values(parMatiere).map((groupe) => ({
      matiereId: groupe.matiere.id,
      nom: groupe.matiere.nom,
      code: groupe.matiere.code,
      coefficient: Number(groupe.matiere.coefficient),
      creditsEcts: groupe.matiere.creditsEcts,
      moyenne: calculerMoyennePonderee(groupe.notes.map((n) => ({ valeur: Number(n.valeur), coefficient: Number(n.coefficientEvaluation) }))),
    }));

    const moyenneGenerale = calculerMoyennePonderee(matieres.map((m) => ({ valeur: m.moyenne, coefficient: m.coefficient })));

    const notesPromotion = await notesRepository.findNotesValideesPourPromotion(inscription.filiereId, semestre, anneeScolaire);
    const moyennesParEtudiant = computeMoyennesParEtudiant(notesPromotion);
    const classement = calculerClassement(moyennesParEtudiant);

    return {
      matieres,
      moyenneGenerale,
      rang: classement.get(etudiantId) ?? null,
      effectifPromotion: moyennesParEtudiant.length,
    };
  },
};

interface NoteAvecMatiere {
  matiereId: string;
  valeur: unknown;
  coefficientEvaluation: unknown;
  matiere: { id: string; nom: string; code: string; coefficient: unknown; creditsEcts: number };
}

function groupByMatiere(notes: NoteAvecMatiere[]) {
  const groupes: Record<string, { matiere: NoteAvecMatiere['matiere']; notes: NoteAvecMatiere[] }> = {};
  for (const note of notes) {
    if (!groupes[note.matiereId]) groupes[note.matiereId] = { matiere: note.matiere, notes: [] };
    groupes[note.matiereId].notes.push(note);
  }
  return groupes;
}

interface NotePromotion {
  etudiantId: string;
  matiereId: string;
  valeur: unknown;
  coefficientEvaluation: unknown;
  matiere: { coefficient: unknown };
}

/**
 * Même méthode à deux niveaux que `consulterPourEtudiant` (notes -> moyenne de
 * matière pondérée par coefficientEvaluation, puis moyenne générale pondérée
 * par le coefficient ECTS de chaque matière), appliquée à toute la promotion
 * pour garantir un classement cohérent avec la moyenne affichée à l'étudiant.
 */
function computeMoyennesParEtudiant(notes: NotePromotion[]) {
  const parEtudiant: Record<string, Record<string, { valeur: number; coefficient: number; matiereCoefficient: number }[]>> = {};

  for (const note of notes) {
    parEtudiant[note.etudiantId] ??= {};
    parEtudiant[note.etudiantId][note.matiereId] ??= [];
    parEtudiant[note.etudiantId][note.matiereId].push({
      valeur: Number(note.valeur),
      coefficient: Number(note.coefficientEvaluation),
      matiereCoefficient: Number(note.matiere.coefficient),
    });
  }

  return Object.entries(parEtudiant).map(([etudiantId, parMatiere]) => {
    const moyennesMatieres = Object.values(parMatiere).map((notesMatiere) => ({
      valeur: calculerMoyennePonderee(notesMatiere.map((n) => ({ valeur: n.valeur, coefficient: n.coefficient }))),
      coefficient: notesMatiere[0].matiereCoefficient,
    }));
    return { id: etudiantId, moyenne: calculerMoyennePonderee(moyennesMatieres) };
  });
}
