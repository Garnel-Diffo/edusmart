import type { JourSemaine, TypeSeance } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { edtRepository } from '@/modules/edt/edt.repository';
import { ApiError } from '@/utils/ApiError';
import { cacheGet, cacheSet, cacheDel } from '@/config/redis';
import { recordAudit } from '@/utils/audit';
import { notifyManyUsers } from '@/modules/notifications/notifications.service';
import { emitToFiliere } from '@/sockets/emit';
import { SOCKET_EVENTS } from '@/sockets/rooms';
import { intervallesSeChevauchent, suggererCreneaux } from '@/utils/scheduling';

const CACHE_TTL_SECONDS = 600;

function cacheKey(filiereId: string, semestre: number, anneeScolaire: string) {
  return `edt:${filiereId}:${semestre}:${anneeScolaire}`;
}

export const edtService = {
  /** UC5 - Consulter l'emploi du temps (mise en cache Redis, NFR < 1.5s + disponibilité hors-ligne). */
  async getForFiliere(filiereId: string, semestre: number, anneeScolaire: string) {
    const key = cacheKey(filiereId, semestre, anneeScolaire);
    const cached = await cacheGet(key);
    if (cached) return cached;

    const edt = await edtRepository.findEmploiDuTemps(filiereId, semestre, anneeScolaire);
    if (!edt) return null; // UC5 - 3a : "Emploi du temps non encore disponible"

    await cacheSet(key, edt, CACHE_TTL_SECONDS);
    return edt;
  },

  /** UC5 - 3b : l'enseignant consulte son propre planning, toutes filières confondues. */
  getForEnseignant(enseignantId: string) {
    return edtRepository.findSeancesForEnseignant(enseignantId);
  },

  /** Filière active de l'étudiant, pour pré-remplir la consultation de son EDT sans qu'il ait à la sélectionner. */
  async getFiliereIdPourEtudiant(etudiantId: string): Promise<string | null> {
    const inscription = await prisma.inscription.findFirst({
      where: { etudiantId, statut: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { filiereId: true },
    });
    return inscription?.filiereId ?? null;
  },

  /** UC6 - Crée l'EDT du semestre s'il n'existe pas encore. */
  async ensureEmploiDuTemps(filiereId: string, semestre: number, anneeScolaire: string, adminId: string) {
    const existing = await edtRepository.findEmploiDuTemps(filiereId, semestre, anneeScolaire);
    if (existing) return existing;
    return edtRepository.createEmploiDuTemps(filiereId, semestre, anneeScolaire, adminId);
  },

  /** UC6 - Ajoute une séance avec détection exhaustive des conflits (salle + enseignant). */
  async addSeance(
    emploiDuTempsId: string,
    data: {
      matiereId: string;
      salleId: string;
      enseignantId: string;
      jourSemaine: JourSemaine;
      heureDebut: string;
      heureFin: string;
      typeSeance: TypeSeance;
    },
    adminId: string,
  ) {
    await this.verifierAbsenceDeConflit(data);

    const seance = await edtRepository.createSeance({ ...data, emploiDuTempsId });
    await this.invaliderCacheEtNotifier(emploiDuTempsId, adminId, 'CREATE', seance.id);
    return seance;
  },

  async updateSeance(
    seanceId: string,
    data: Partial<{
      matiereId: string;
      salleId: string;
      enseignantId: string;
      jourSemaine: JourSemaine;
      heureDebut: string;
      heureFin: string;
      typeSeance: TypeSeance;
    }>,
    adminId: string,
  ) {
    const existante = await edtRepository.findSeanceById(seanceId);
    if (!existante) throw ApiError.notFound('Séance introuvable');

    const merged = { ...existante, ...data };
    await this.verifierAbsenceDeConflit(
      {
        jourSemaine: merged.jourSemaine,
        salleId: merged.salleId,
        enseignantId: merged.enseignantId,
        heureDebut: merged.heureDebut,
        heureFin: merged.heureFin,
      },
      seanceId,
    );

    const seance = await edtRepository.updateSeance(seanceId, data);
    await this.invaliderCacheEtNotifier(existante.emploiDuTempsId, adminId, 'UPDATE', seanceId);
    return seance;
  },

  async deleteSeance(seanceId: string, adminId: string) {
    const existante = await edtRepository.findSeanceById(seanceId);
    if (!existante) throw ApiError.notFound('Séance introuvable');

    await edtRepository.deleteSeance(seanceId); // UC6 - 4b : confirmation gérée côté frontend avant l'appel
    await this.invaliderCacheEtNotifier(existante.emploiDuTempsId, adminId, 'DELETE', seanceId);
  },

  /** UC6 - 4a : conflit détecté → exception avec créneaux alternatifs proposés. */
  async verifierAbsenceDeConflit(
    params: { jourSemaine: JourSemaine; salleId: string; enseignantId: string; heureDebut: string; heureFin: string },
    excludeSeanceId?: string,
  ) {
    const candidats = await edtRepository.findConflicts({ ...params, excludeSeanceId });
    const conflits = candidats.filter((s) => intervallesSeChevauchent(params.heureDebut, params.heureFin, s.heureDebut, s.heureFin));

    if (conflits.length > 0) {
      const creneauxAlternatifs = suggererCreneaux(params.heureFin);
      throw ApiError.conflict('Conflit détecté : salle ou enseignant déjà occupé sur ce créneau', {
        conflits: conflits.map((c) => ({ id: c.id, jourSemaine: c.jourSemaine, heureDebut: c.heureDebut, heureFin: c.heureFin })),
        creneauxAlternatifs,
      });
    }
  },

  async invaliderCacheEtNotifier(emploiDuTempsId: string, adminId: string, action: string, seanceId: string) {
    const edt = await prisma.emploiDuTemps.findUnique({ where: { id: emploiDuTempsId } });
    if (!edt) return;

    await cacheDel(cacheKey(edt.filiereId, edt.semestre, edt.anneeScolaire));
    await recordAudit({ utilisateurId: adminId, action: `EDT_${action}`, entite: 'Seance', entiteId: seanceId });

    emitToFiliere(edt.filiereId, SOCKET_EVENTS.EDT_UPDATED, { emploiDuTempsId, action });

    const etudiants = await prisma.etudiant.findMany({
      where: { inscriptions: { some: { filiereId: edt.filiereId, statut: 'ACTIVE' } } },
      select: { utilisateurId: true },
    });
    await notifyManyUsers(
      etudiants.map((e) => ({
        destinataireId: e.utilisateurId,
        type: 'EDT_MODIFIE',
        titre: "L'emploi du temps a été mis à jour",
        contenu: 'Une ou plusieurs séances ont été modifiées pour votre filière.',
        lien: '/emploi-du-temps',
        envoyerEmail: true,
      })),
    );
  },
};
