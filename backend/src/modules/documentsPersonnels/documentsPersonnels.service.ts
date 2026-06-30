import type { FormatDocumentPersonnel } from '@prisma/client';
import { documentsPersonnelsRepository } from '@/modules/documentsPersonnels/documentsPersonnels.repository';
import { ApiError } from '@/utils/ApiError';
import { uploadDocumentBuffer } from '@/utils/cloudinaryUpload';
import { indexationPersonnelleQueue } from '@/jobs/queues';

const MIME_TO_FORMAT: Record<string, FormatDocumentPersonnel> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
};

export const documentsPersonnelsService = {
  /** UC14 étendu - L'étudiant dépose un support personnel pour ses propres révisions. */
  async upload(
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    data: { titre: string },
    etudiantId: string,
  ) {
    const format = MIME_TO_FORMAT[file.mimetype];
    if (!format) throw ApiError.badRequest('Format de fichier non supporté. Formats acceptés : PDF, PPTX, DOCX, JPEG, PNG.');

    const resourceType = format === 'IMAGE' ? 'image' : 'raw';
    const { publicId, secureUrl, bytes, version } = await uploadDocumentBuffer(
      file.buffer,
      `edusmart/documents-personnels/${etudiantId}`,
      file.originalname,
      resourceType,
    );

    const document = await documentsPersonnelsRepository.create({
      etudiantId,
      titre: data.titre,
      nomFichier: file.originalname,
      format,
      tailleOctets: bytes,
      cloudinaryPublicId: publicId,
      cloudinaryVersion: version,
      cloudinaryUrl: secureUrl,
    });

    await indexationPersonnelleQueue.add('index-document-personnel', { documentPersonnelId: document.id });

    return document;
  },

  list(etudiantId: string) {
    return documentsPersonnelsRepository.findManyForEtudiant(etudiantId);
  },

  async marquerStatutIndexation(documentPersonnelId: string, statut: 'EN_COURS' | 'INDEXE' | 'ERREUR') {
    await documentsPersonnelsRepository.updateStatutIndexation(documentPersonnelId, statut);
  },
};
