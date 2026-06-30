import { PrismaClient } from '@prisma/client';
import { isDevelopment } from '@/config/env';
import { logger } from '@/config/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (isDevelopment) {
  global.__prisma = prisma;
}

/**
 * Connexion explicite appelée une seule fois au démarrage du serveur
 * (src/server.ts), afin d'échouer rapidement si la base est inaccessible.
 * Volontairement absente du chargement du module : un simple `import` de ce
 * fichier (ex. dans les tests unitaires) ne doit jamais déclencher d'I/O réseau.
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('✅ Connexion PostgreSQL (Prisma) établie');
}
