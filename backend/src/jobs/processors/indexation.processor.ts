import { Worker, type Job } from 'bullmq';
import { createBullMQConnection } from '@/config/redis';
import { QUEUE_NAMES } from '@/jobs/queues';
import { coursService } from '@/modules/cours/cours.service';
import { coursRepository } from '@/modules/cours/cours.repository';
import { aiServiceClient } from '@/utils/aiServiceClient';
import { buildSignedDownloadUrl } from '@/utils/cloudinaryUpload';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';

interface IndexationJobData {
  coursDocumentId: string;
}

/**
 * Worker BullMQ : déclenche l'indexation RAG auprès du service IA Python
 * (UC3 - étape 6). Une URL signée fraîche (15 min) est générée à chaque
 * tentative à partir du `cloudinaryPublicId` stocké en base. En cas d'échec,
 * le statut repasse en ERREUR et BullMQ relance automatiquement après 30
 * minutes (3 tentatives, cf. jobs/queues.ts - UC3 alt. 6a).
 */
export function startIndexationWorker(): Worker {
  const worker = new Worker<IndexationJobData>(
    QUEUE_NAMES.INDEXATION_RAG,
    async (job: Job<IndexationJobData>) => {
      const document = await coursRepository.findById(job.data.coursDocumentId);
      if (!document) throw ApiError.notFound('Document introuvable pour indexation');

      await coursService.marquerStatutIndexation(document.id, 'EN_COURS');
      const cloudinaryUrl = buildSignedDownloadUrl(document.cloudinaryPublicId, document.cloudinaryVersion);
      await aiServiceClient.declencherIndexation({ coursDocumentId: document.id, cloudinaryUrl, format: document.format });
      await coursService.marquerStatutIndexation(document.id, 'INDEXE');
    },
    { connection: createBullMQConnection(), concurrency: 5, lockDuration: 180_000 },
  );

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, "Échec d'indexation RAG");
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      // Le document peut avoir été supprimé entre la création du job et cet échec
      // final (P2025) : ne jamais laisser ce rejet non intercepté planter le process.
      await coursService.marquerStatutIndexation(job.data.coursDocumentId, 'ERREUR').catch((e) => {
        logger.error({ jobId: job.id, err: e }, "Échec de la mise à jour du statut ERREUR (document probablement supprimé)");
      });
    }
  });

  return worker;
}
