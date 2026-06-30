import { notificationsRepository, type CreateNotificationInput } from '@/modules/notifications/notifications.repository';
import { notificationsQueue } from '@/jobs/queues';
import { emitToUser } from '@/sockets/emit';
import { SOCKET_EVENTS } from '@/sockets/rooms';
import { logger } from '@/config/logger';
import { parsePagination, buildPaginatedResult, type PaginationQuery } from '@/utils/pagination';

export interface NotifyInput extends CreateNotificationInput {
  /** Si vrai, une copie est également envoyée par email (Brevo) via la file de jobs. */
  envoyerEmail?: boolean;
}

/**
 * Point d'entrée unique utilisé par tous les modules métier pour notifier un
 * utilisateur (UC20). Persiste la notification, la diffuse en temps réel via
 * Socket.io à l'utilisateur s'il est connecté, et délègue l'envoi fiable
 * (email + retraitement en cas d'échec) à une file BullMQ.
 */
export async function notifyUser(input: NotifyInput) {
  const notification = await notificationsRepository.create(input);

  try {
    emitToUser(input.destinataireId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);
  } catch (err) {
    logger.warn({ err }, 'Diffusion Socket.io de la notification impossible (utilisateur hors ligne ?)');
  }

  await notificationsQueue.add('dispatch', {
    notificationId: notification.id,
    envoyerEmail: input.envoyerEmail ?? false,
  });

  return notification;
}

export async function notifyManyUsers(inputs: NotifyInput[]) {
  return Promise.all(inputs.map((input) => notifyUser(input)));
}

export const notificationsService = {
  async listForUser(destinataireId: string, query: PaginationQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const [data, total] = await Promise.all([
      notificationsRepository.findForUser(destinataireId, skip, take),
      notificationsRepository.countForUser(destinataireId),
    ]);
    return buildPaginatedResult(data, total, page, pageSize);
  },

  countNonLues(destinataireId: string) {
    return notificationsRepository.countNonLues(destinataireId);
  },

  async markLue(id: string, destinataireId: string) {
    await notificationsRepository.markLue(id, destinataireId);
  },

  async markToutesLues(destinataireId: string) {
    await notificationsRepository.markToutesLues(destinataireId);
  },
};
