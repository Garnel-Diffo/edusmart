import { Worker, type Job } from 'bullmq';
import { createBullMQConnection } from '@/config/redis';
import { QUEUE_NAMES } from '@/jobs/queues';
import { documentsPersonnelsService } from '@/modules/documentsPersonnels/documentsPersonnels.service';
import { documentsPersonnelsRepository } from '@/modules/documentsPersonnels/documentsPersonnels.repository';
import { aiServiceClient } from '@/utils/aiServiceClient';
import { buildSignedDownloadUrl } from '@/utils/cloudinaryUpload';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';

interface IndexationPersonnelleJobData {
  documentPersonnelId: string;
}

/**
 * Worker BullMQ : déclenche l'indexation RAG d'un support personnel auprès du
 * service IA Python (UC14 étendu). Même pattern que l'indexation des cours
 * officiels (URL signée régénérée à chaque tentative), isolé dans sa propre
 * file pour ne jamais retarder l'indexation des cours par des OCR plus lents.
 */
export function startIndexationPersonnelleWorker(): Worker {
  const worker = new Worker<IndexationPersonnelleJobData>(
    QUEUE_NAMES.INDEXATION_PERSONNELLE,
    async (job: Job<IndexationPersonnelleJobData>) => {
      const document = await documentsPersonnelsRepository.findById(job.data.documentPersonnelId);
      if (!document) throw ApiError.notFound('Document personnel introuvable pour indexation');

      await documentsPersonnelsService.marquerStatutIndexation(document.id, 'EN_COURS');
      const resourceType = document.format === 'IMAGE' ? 'image' : 'raw';
      const extension = document.nomFichier.split('.').pop();
      const cloudinaryUrl = buildSignedDownloadUrl(document.cloudinaryPublicId, document.cloudinaryVersion, resourceType, extension);
      await aiServiceClient.declencherIndexationPersonnelle({
        documentPersonnelId: document.id,
        cloudinaryUrl,
        format: document.format,
      });
      await documentsPersonnelsService.marquerStatutIndexation(document.id, 'INDEXE');
    },
    { connection: createBullMQConnection(), concurrency: 3, lockDuration: 180_000 },
  );

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, "Échec d'indexation d'un support personnel");
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      // Le document peut avoir été supprimé entre la création du job et cet échec
      // final (P2025) : ne jamais laisser ce rejet non intercepté planter le process.
      await documentsPersonnelsService.marquerStatutIndexation(job.data.documentPersonnelId, 'ERREUR').catch((e) => {
        logger.error({ jobId: job.id, err: e }, "Échec de la mise à jour du statut ERREUR (document probablement supprimé)");
      });
    }
  });

  return worker;
}
