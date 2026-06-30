import { prisma } from '@/config/prisma';
import { logger } from '@/config/logger';

export interface AuditEntry {
  utilisateurId?: string | null;
  action: string;
  entite: string;
  entiteId?: string | null;
  donneesAvant?: unknown;
  donneesApres?: unknown;
  ip?: string | null;
}

/**
 * Journalise une action sensible (UC6, UC9, UC10, UC18, UC21 : "toute action
 * sensible loggée : utilisateur_id, action, timestamp, avant/après"). N'échoue
 * jamais l'opération métier appelante : un échec d'audit est uniquement loggé
 * côté serveur.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        utilisateurId: entry.utilisateurId ?? null,
        action: entry.action,
        entite: entry.entite,
        entiteId: entry.entiteId ?? null,
        donneesAvant: entry.donneesAvant as never,
        donneesApres: entry.donneesApres as never,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, entry }, "Échec d'écriture de l'audit log");
  }
}
