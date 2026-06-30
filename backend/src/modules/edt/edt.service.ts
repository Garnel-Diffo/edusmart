import { prisma } from '@/config/prisma';
import { edtRepository } from '@/modules/edt/edt.repository';
import { cacheGet, cacheSet, cacheDel } from '@/config/redis';
import { recordAudit } from '@/utils/audit';
import { notifyManyUsers } from '@/modules/notifications/notifications.service';
import { emitToFiliere } from '@/sockets/emit';
import { SOCKET_EVENTS } from '@/sockets/rooms';
import { uploadPublicFileBuffer, deleteCloudinaryAsset } from '@/utils/cloudinaryUpload';

const CACHE_TTL_SECONDS = 600;

function cacheKey(filiereId: string, semestre: number, anneeScolaire: string) {
  return `edt:${filiereId}:${semestre}:${anneeScolaire}`;
}

export const edtService = {
  /** UC5 - Consulter l'emploi du temps (fichier image/PDF, mise en cache Redis). */
  async getForFiliere(filiereId: string, semestre: number, anneeScolaire: string) {
    const key = cacheKey(filiereId, semestre, anneeScolaire);
    const cached = await cacheGet(key);
    if (cached) return cached;

    const edt = await edtRepository.findEmploiDuTemps(filiereId, semestre, anneeScolaire);
    if (!edt) return null; // UC5 - 3a : "Emploi du temps non encore disponible"

    await cacheSet(key, edt, CACHE_TTL_SECONDS);
    return edt;
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

  /** UC6 - Dépose (ou remplace) le fichier d'emploi du temps d'une filière pour un semestre donné. */
  async uploadEmploiDuTemps(
    params: { filiereId: string; semestre: number; anneeScolaire: string; titre?: string },
    file: { buffer: Buffer; mimetype: string },
    adminId: string,
  ) {
    const existant = await edtRepository.findEmploiDuTemps(params.filiereId, params.semestre, params.anneeScolaire);

    const format = file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
    const resourceType = format === 'PDF' ? 'raw' : 'image';
    const { publicId, secureUrl } = await uploadPublicFileBuffer(file.buffer, `edusmart/edt/${params.filiereId}`, resourceType);

    const edt = await edtRepository.upsert({
      ...params,
      format,
      cloudinaryPublicId: publicId,
      cloudinaryUrl: secureUrl,
      createdById: adminId,
    });

    if (existant && existant.cloudinaryPublicId !== publicId) {
      const ancienResourceType = existant.format === 'PDF' ? 'raw' : 'image';
      await deleteCloudinaryAsset(existant.cloudinaryPublicId, ancienResourceType).catch(() => undefined);
    }

    await cacheDel(cacheKey(params.filiereId, params.semestre, params.anneeScolaire));
    await recordAudit({
      utilisateurId: adminId,
      action: existant ? 'EDT_REMPLACE' : 'EDT_DEPOSE',
      entite: 'EmploiDuTemps',
      entiteId: edt.id,
      donneesApres: { filiereId: params.filiereId, semestre: params.semestre, anneeScolaire: params.anneeScolaire },
    });

    emitToFiliere(params.filiereId, SOCKET_EVENTS.EDT_UPDATED, { emploiDuTempsId: edt.id });

    const etudiants = await prisma.etudiant.findMany({
      where: { inscriptions: { some: { filiereId: params.filiereId, statut: 'ACTIVE' } } },
      select: { utilisateurId: true },
    });
    await notifyManyUsers(
      etudiants.map((e) => ({
        destinataireId: e.utilisateurId,
        type: 'EDT_MODIFIE',
        titre: "L'emploi du temps a été mis à jour",
        contenu: `Le nouvel emploi du temps du semestre ${params.semestre} (${params.anneeScolaire}) est disponible.`,
        lien: '/etudiant/edt',
        envoyerEmail: true,
      })),
    );

    return edt;
  },
};
