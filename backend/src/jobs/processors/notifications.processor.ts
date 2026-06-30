import { Worker, type Job } from 'bullmq';
import { createBullMQConnection } from '@/config/redis';
import { QUEUE_NAMES } from '@/jobs/queues';
import { prisma } from '@/config/prisma';
import { notificationsRepository } from '@/modules/notifications/notifications.repository';
import { sendEmail } from '@/config/brevo';
import { genericNotificationEmail } from '@/utils/emailTemplates';
import { logger } from '@/config/logger';

interface DispatchJobData {
  notificationId: string;
  envoyerEmail: boolean;
}

/**
 * Worker BullMQ : traite l'envoi fiable des notifications (UC20). 5 tentatives
 * avec backoff exponentiel en cas d'échec (E1 : "défaillance du service de
 * push : journalisation et retraitement automatique").
 */
export function startNotificationsWorker(): Worker {
  const worker = new Worker<DispatchJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job: Job<DispatchJobData>) => {
      const notification = await notificationsRepository.findById(job.data.notificationId);
      if (!notification) return;

      if (job.data.envoyerEmail) {
        const destinataire = await prisma.utilisateur.findUnique({ where: { id: notification.destinataireId } });
        if (destinataire) {
          const { subject, html } = genericNotificationEmail({
            prenom: destinataire.prenom,
            titre: notification.titre,
            contenu: notification.contenu,
            lien: notification.lien ?? undefined,
          });
          await sendEmail({ to: [{ email: destinataire.email, name: `${destinataire.prenom} ${destinataire.nom}` }], subject, htmlContent: html });
        }
      }

      await notificationsRepository.markEnvoyee(notification.id);
    },
    { connection: createBullMQConnection(), concurrency: 10 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Échec définitif du traitement d\'une notification');
  });

  return worker;
}
