import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export interface AuditFilters {
  action?: string;
  entite?: string;
  utilisateurId?: string;
  dateDebut?: string;
  dateFin?: string;
  q?: string;
}

export const auditRepository = {
  findMany(filters: AuditFilters, skip: number, take: number) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entite ? { entite: filters.entite } : {}),
      ...(filters.utilisateurId ? { utilisateurId: filters.utilisateurId } : {}),
      ...(filters.dateDebut || filters.dateFin
        ? {
            createdAt: {
              ...(filters.dateDebut ? { gte: new Date(filters.dateDebut) } : {}),
              ...(filters.dateFin ? { lte: new Date(new Date(filters.dateFin).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {}),
      ...(filters.q
        ? {
            utilisateur: {
              OR: [
                { nom: { contains: filters.q, mode: 'insensitive' } },
                { prenom: { contains: filters.q, mode: 'insensitive' } },
                { email: { contains: filters.q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    return Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true, email: true, role: true, avatarUrl: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
  },

  distinctActions() {
    return prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } });
  },

  distinctEntites() {
    return prisma.auditLog.findMany({ distinct: ['entite'], select: { entite: true }, orderBy: { entite: 'asc' } });
  },
};
