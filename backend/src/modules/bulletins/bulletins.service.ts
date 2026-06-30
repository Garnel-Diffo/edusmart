import dayjs from 'dayjs';
import { bulletinsRepository } from '@/modules/bulletins/bulletins.repository';
import { notesRepository } from '@/modules/notes/notes.repository';
import { ApiError } from '@/utils/ApiError';
import { calculerMoyennePonderee, calculerMention, calculerClassement } from '@/utils/grading';
import { uploadDocumentBuffer } from '@/utils/cloudinaryUpload';
import { renderHtmlToPdf } from '@/utils/pdfGenerator';
import { bulletinSemestreHtml, pvDeliberationHtml, type BulletinMatiereLigne, type PVLigneDecision } from '@/utils/documentTemplates';
import { generationPdfQueue } from '@/jobs/queues';
import { recordAudit } from '@/utils/audit';
import { notifyManyUsers } from '@/modules/notifications/notifications.service';
import { env } from '@/config/env';

const RETENTION_PV_ANNEES = 10; // UC11 NFR archivage

export const bulletinsService = {
  /** UC11 - étape 1-3 : vérifie l'exhaustivité des validations puis déclenche la génération en file (asynchrone, par lots). */
  async lancerGeneration(filiereId: string, niveau: string, semestre: number, anneeScolaire: string, adminId: string) {
    const matieresIncompletes = await bulletinsRepository.findMatieresAvecNotesNonValidees(filiereId, semestre, anneeScolaire);
    if (matieresIncompletes.length > 0) {
      throw ApiError.conflict('Certaines matières ont des notes non validées', { matieresIncompletes }); // UC11 - 3a
    }

    const job = await generationPdfQueue.add('bulletins-et-pv', { filiereId, niveau, semestre, anneeScolaire, adminId });
    return { jobId: job.id, statut: 'EN_COURS' as const };
  },

  /** Traitement effectif (appelé par le worker BullMQ - jobs/processors/generationPdf.processor.ts). */
  async genererPourFiliere(filiereId: string, niveau: string, semestre: number, anneeScolaire: string, adminId: string) {
    const filiere = await bulletinsRepository.findFiliere(filiereId);
    if (!filiere) throw ApiError.notFound('Filière introuvable');

    const etudiants = await bulletinsRepository.findEtudiantsActifs(filiereId, anneeScolaire);
    const notesPromotion = await notesRepository.findNotesValideesPourPromotion(filiereId, semestre, anneeScolaire);

    const moyennesParEtudiant = computeMoyennesEtMatieres(notesPromotion);
    const classement = calculerClassement(Object.entries(moyennesParEtudiant).map(([id, v]) => ({ id, moyenne: v.moyenneGenerale })));

    const lignesPV: PVLigneDecision[] = [];

    for (const etudiant of etudiants) {
      const donnees = moyennesParEtudiant[etudiant.utilisateurId];
      const moyenneGenerale = donnees?.moyenneGenerale ?? 0;
      const rang = classement.get(etudiant.utilisateurId) ?? etudiants.length;
      const mention = calculerMention(moyenneGenerale);

      const matieresLignes: BulletinMatiereLigne[] = (donnees?.matieres ?? []).map((m) => ({
        nom: m.nom,
        code: m.code,
        coefficient: m.coefficient,
        creditsEcts: m.creditsEcts,
        moyenne: m.moyenne,
      }));

      const html = bulletinSemestreHtml({
        etablissement: env.ETABLISSEMENT_NOM,
        etudiantNom: etudiant.utilisateur.nom,
        etudiantPrenom: etudiant.utilisateur.prenom,
        matricule: etudiant.matricule,
        filiere: filiere.nom,
        niveau,
        semestre,
        anneeScolaire,
        matieres: matieresLignes,
        moyenneGenerale,
        mention,
        rang,
        effectifPromotion: etudiants.length,
      });

      const pdfBuffer = await renderHtmlToPdf(html);
      const { secureUrl } = await uploadDocumentBuffer(pdfBuffer, `edusmart/bulletins/${filiereId}/${anneeScolaire}`, `bulletin-${etudiant.matricule}-s${semestre}`);

      await bulletinsRepository.upsertBulletin({
        etudiantId: etudiant.utilisateurId,
        semestre,
        anneeScolaire,
        moyenneGenerale,
        rang,
        mention,
        pdfCloudinaryUrl: secureUrl,
        genereParId: adminId,
      });

      lignesPV.push({
        nom: etudiant.utilisateur.nom,
        prenom: etudiant.utilisateur.prenom,
        matricule: etudiant.matricule,
        moyenneGenerale,
        rang,
        decision: moyenneGenerale >= env.SEUIL_ADMISSION ? 'ADMIS' : 'AJOURNE',
      });
    }

    const pvHtml = pvDeliberationHtml({ etablissement: env.ETABLISSEMENT_NOM, filiere: filiere.nom, niveau, semestre, anneeScolaire, lignes: lignesPV });
    const pvBuffer = await renderHtmlToPdf(pvHtml);
    const { secureUrl: pvUrl } = await uploadDocumentBuffer(pvBuffer, `edusmart/pv/${filiereId}`, `pv-${niveau}-s${semestre}-${anneeScolaire}`);

    await bulletinsRepository.upsertPV({
      filiereId,
      niveau,
      semestre,
      anneeScolaire,
      pdfCloudinaryUrl: pvUrl,
      decisionsJson: lignesPV,
      genereParId: adminId,
      archiveJusquA: dayjs().add(RETENTION_PV_ANNEES, 'year').toDate(),
    });

    await recordAudit({ utilisateurId: adminId, action: 'GENERATION_BULLETINS_PV', entite: 'Filiere', entiteId: filiereId, donneesApres: { semestre, anneeScolaire, nbEtudiants: etudiants.length } });

    await notifyManyUsers(
      etudiants.map((e) => ({
        destinataireId: e.utilisateurId,
        type: 'BULLETIN_DISPONIBLE',
        titre: 'Votre bulletin de semestre est disponible',
        contenu: `Le bulletin du semestre ${semestre} (${anneeScolaire}) a été publié.`,
        lien: '/notes/bulletin',
        envoyerEmail: true,
      })),
    );

    return { nbBulletins: etudiants.length };
  },
};

interface MatiereCalculee {
  id: string;
  nom: string;
  code: string;
  coefficient: number;
  creditsEcts: number;
  moyenne: number;
}

function computeMoyennesEtMatieres(
  notes: { etudiantId: string; matiereId: string; valeur: unknown; coefficientEvaluation: unknown; matiere: { coefficient: unknown; nom?: string; code?: string; creditsEcts?: number } }[],
) {
  const parEtudiant: Record<string, Record<string, { valeurs: { valeur: number; coefficient: number }[]; matiere: typeof notes[number]['matiere'] }>> = {};

  for (const note of notes) {
    parEtudiant[note.etudiantId] ??= {};
    parEtudiant[note.etudiantId][note.matiereId] ??= { valeurs: [], matiere: note.matiere };
    parEtudiant[note.etudiantId][note.matiereId].valeurs.push({ valeur: Number(note.valeur), coefficient: Number(note.coefficientEvaluation) });
  }

  const resultat: Record<string, { moyenneGenerale: number; matieres: MatiereCalculee[] }> = {};
  for (const [etudiantId, parMatiere] of Object.entries(parEtudiant)) {
    const matieres: MatiereCalculee[] = Object.entries(parMatiere).map(([matiereId, groupe]) => ({
      id: matiereId,
      nom: groupe.matiere.nom ?? '',
      code: groupe.matiere.code ?? '',
      coefficient: Number(groupe.matiere.coefficient),
      creditsEcts: groupe.matiere.creditsEcts ?? 0,
      moyenne: calculerMoyennePonderee(groupe.valeurs),
    }));
    const moyenneGenerale = calculerMoyennePonderee(matieres.map((m) => ({ valeur: m.moyenne, coefficient: m.coefficient })));
    resultat[etudiantId] = { moyenneGenerale, matieres };
  }
  return resultat;
}
