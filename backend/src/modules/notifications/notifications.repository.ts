import { prisma } from '@/config/prisma';
import type { CanalNotification } from '@prisma/client';

export interface CreateNotificationInput {
  destinataireId: string;
  type: string;
  titre: string;
  contenu: string;
  lien?: string;
  canal?: CanalNotification;
}

export const notificationsRepository = {
  create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        destinataireId: input.destinataireId,
        type: input.type,
        titre: input.titre,
        contenu: input.contenu,
        lien: input.lien,
        canal: input.canal ?? 'IN_APP',
      },
    });
  },

  createMany(inputs: CreateNotificationInput[]) {
    return prisma.notification.createMany({
      data: inputs.map((i) => ({
        destinataireId: i.destinataireId,
        type: i.type,
        titre: i.titre,
        contenu: i.contenu,
        lien: i.lien,
        canal: i.canal ?? 'IN_APP',
      })),
    });
  },

  markEnvoyee(id: string) {
    return prisma.notification.update({ where: { id }, data: { envoyeLe: new Date() } });
  },

  markLue(id: string, destinataireId: string) {
    return prisma.notification.updateMany({
      where: { id, destinataireId },
      data: { estLue: true, luLe: new Date() },
    });
  },

  markToutesLues(destinataireId: string) {
    return prisma.notification.updateMany({
      where: { destinataireId, estLue: false },
      data: { estLue: true, luLe: new Date() },
    });
  },

  findForUser(destinataireId: string, skip: number, take: number) {
    return prisma.notification.findMany({
      where: { destinataireId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  countForUser(destinataireId: string) {
    return prisma.notification.count({ where: { destinataireId } });
  },

  countNonLues(destinataireId: string) {
    return prisma.notification.count({ where: { destinataireId, estLue: false } });
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },
};
