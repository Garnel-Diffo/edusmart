import { Worker, type Job } from 'bullmq';
import { createBullMQConnection } from '@/config/redis';
import { QUEUE_NAMES } from '@/jobs/queues';
import { bulletinsService } from '@/modules/bulletins/bulletins.service';
import { logger } from '@/config/logger';

interface GenerationJobData {
  filiereId: string;
  niveau: string;
  semestre: number;
  anneeScolaire: string;
  adminId: string;
}

/**
 * Worker BullMQ : génère les bulletins + PV de délibération d'une promotion.
 * Traité hors requête HTTP pour respecter le NFR de 2 minutes sans bloquer
 * l'API, avec réessai automatique en cas d'erreur mémoire/rendu (UC11 - E1).
 */
export function startGenerationPdfWorker(): Worker {
  const worker = new Worker<GenerationJobData>(
    QUEUE_NAMES.GENERATION_PDF,
    async (job: Job<GenerationJobData>) => {
      const { filiereId, niveau, semestre, anneeScolaire, adminId } = job.data;
      return bulletinsService.genererPourFiliere(filiereId, niveau, semestre, anneeScolaire, adminId);
    },
    { connection: createBullMQConnection(), concurrency: 2 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Échec de génération des bulletins/PV');
  });

  return worker;
}
