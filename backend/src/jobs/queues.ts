import { Queue } from 'bullmq';
import { createBullMQConnection } from '@/config/redis';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  INDEXATION_RAG: 'indexation-rag',
  INDEXATION_PERSONNELLE: 'indexation-personnelle',
  GENERATION_PDF: 'generation-pdf',
} as const;

const connection = createBullMQConnection();

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86_400 },
};

export const notificationsQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
  connection,
  defaultJobOptions,
});

export const indexationRagQueue = new Queue(QUEUE_NAMES.INDEXATION_RAG, {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
    backoff: { type: 'fixed' as const, delay: 30 * 60_000 }, // relance à 30 min (UC3 - 6a)
  },
});

export const indexationPersonnelleQueue = new Queue(QUEUE_NAMES.INDEXATION_PERSONNELLE, {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
    backoff: { type: 'fixed' as const, delay: 30 * 60_000 },
  },
});

export const generationPdfQueue = new Queue(QUEUE_NAMES.GENERATION_PDF, {
  connection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 3 },
});
