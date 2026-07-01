import type { FormatDocument, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { coursRepository } from '@/modules/cours/cours.repository';
import { ApiError } from '@/utils/ApiError';
import { uploadDocumentBuffer, buildSignedDownloadUrl } from '@/utils/cloudinaryUpload';
import { indexationRagQueue } from '@/jobs/queues';
import { notifyManyUsers } from '@/modules/notifications/notifications.service';
import { emitToFiliere } from '@/sockets/emit';
import { SOCKET_EVENTS } from '@/sockets/rooms';
import { recordAudit } from '@/utils/audit';
import { parsePagination, buildPaginatedResult, type PaginationQuery } from '@/utils/pagination';

const MIME_TO_FORMAT: Record<string, FormatDocument> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

interface UserContext {
  id: string;
  role: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN_SCOLAIRE' | 'DIRECTION' | 'SUPER_ADMIN';
}

export const coursService = {
  /** UC1 - Consulter cours : la portée est strictement limitée à la filière de l'utilisateur connecté. */
  async list(user: UserContext, filters: { matiereId?: string; moduleId?: string }, query: PaginationQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    let filiereId: string | undefined;
    if (user.role === 'ETUDIANT') {
      const inscription = await coursRepository.findFiliereActiveEtudiant(user.id);
      if (!inscription) return buildPaginatedResult([], 0, page, pageSize);
      filiereId = inscription.filiereId;
    }

    const where: Prisma.CoursDocumentWhereInput = {
      matiereId: filters.matiereId,
      enseignantId: user.role === 'ENSEIGNANT' ? user.id : undefined,
      matiere: filters.moduleId || filiereId ? { moduleId: filters.moduleId, module: filiereId ? { filiereId } : undefined } : undefined,
    };

    const [data, total] = await coursRepository.findMany(where, skip, take);
    return buildPaginatedResult(data, total, page, pageSize);
  },

  /** UC3 - Déposer un support de cours. */
  async upload(
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    data: { matiereId: string; titre: string; remplacerDoublon: boolean },
    enseignantId: string,
  ) {
    const matiere = await prisma.matiere.findUnique({ where: { id: data.matiereId }, include: { module: { include: { filiere: true } } } });
    if (!matiere) throw ApiError.notFound('Matière introuvable');
    if (matiere.enseignantId !== enseignantId) {
      throw ApiError.forbidden("Vous n'êtes pas affecté à cette matière"); // NFR sécurité UC3
    }

    const format = MIME_TO_FORMAT[file.mimetype];
    if (!format) throw ApiError.badRequest('Format de fichier non supporté. Formats acceptés : PDF, PPTX, DOCX.'); // UC3 - 4a

    const doublon = await coursRepository.findByMatiereAndTitre(data.matiereId, file.originalname);
    if (doublon && !data.remplacerDoublon) {
      throw ApiError.conflict('Un document du même nom existe déjà pour cette matière', { documentId: doublon.id, demandeConfirmation: true }); // UC3 - E3
    }

    const { publicId, secureUrl, bytes, version } = await uploadDocumentBuffer(file.buffer, `edusmart/cours/${data.matiereId}`, file.originalname);

    const document = doublon
      ? await coursRepository.replace(doublon.id, {
          titre: data.titre,
          nomFichier: file.originalname,
          format,
          tailleOctets: bytes,
          cloudinaryPublicId: publicId,
          cloudinaryVersion: version,
          cloudinaryUrl: secureUrl,
        })
      : await coursRepository.create({
          matiereId: data.matiereId,
          enseignantId,
          titre: data.titre,
          nomFichier: file.originalname,
          format,
          tailleOctets: bytes,
          cloudinaryPublicId: publicId,
          cloudinaryVersion: version,
          cloudinaryUrl: secureUrl,
        });

    await recordAudit({ utilisateurId: enseignantId, action: 'UPLOAD', entite: 'CoursDocument', entiteId: document.id, donneesApres: { titre: data.titre } });

    // Indexation RAG asynchrone (UC3 - étape 6). Seul l'identifiant est mis en file : le worker
    // régénère une URL signée fraîche à chaque tentative (le document est en delivery `authenticated`
    // et une URL signée n'est valable que 15 min, trop court face au backoff de 30 min en cas d'échec).
    await indexationRagQueue.add('index-document', { coursDocumentId: document.id });

    await this.notifierNouveauCours(document.id, matiere.module.filiereId, data.titre);

    return document;
  },

  async notifierNouveauCours(coursDocumentId: string, filiereId: string, titre: string) {
    const etudiants = await prisma.etudiant.findMany({
      where: { inscriptions: { some: { filiereId, statut: 'ACTIVE' } } },
      select: { utilisateurId: true },
    });

    emitToFiliere(filiereId, SOCKET_EVENTS.COURS_NEW, { coursDocumentId, titre });

    await notifyManyUsers(
      etudiants.map((e) => ({
        destinataireId: e.utilisateurId,
        type: 'NOUVEAU_COURS',
        titre: 'Nouveau support de cours disponible',
        contenu: `Le document "${titre}" a été déposé.`,
        lien: '/etudiant/cours',
      })),
    );
  },

  /** UC2 - Télécharger un document : URL signée Cloudinary valable 15 minutes. */
  async getDownloadUrl(coursDocumentId: string, etudiant: UserContext, ip?: string) {
    const document = await coursRepository.findById(coursDocumentId);
    if (!document) throw ApiError.notFound('Document introuvable'); // UC2 - 3a

    const inscription = await coursRepository.findFiliereActiveEtudiant(etudiant.id);
    if (!inscription || inscription.filiereId !== document.matiere.module.filiereId) {
      throw ApiError.forbidden("Ce document n'appartient pas à votre filière");
    }

    const url = buildSignedDownloadUrl(document.cloudinaryPublicId, document.cloudinaryVersion);

    await coursRepository.incrementTelechargements(coursDocumentId);
    await coursRepository.createTelechargementLog(coursDocumentId, etudiant.id, ip); // traçabilité UC2 NFR

    return { url, nomFichier: document.nomFichier };
  },

  async marquerStatutIndexation(coursDocumentId: string, statut: 'EN_COURS' | 'INDEXE' | 'ERREUR') {
    await coursRepository.updateStatutIndexation(coursDocumentId, statut);
  },
};
