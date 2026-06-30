import { createServer } from 'http';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { prisma, connectDatabase } from '@/config/prisma';
import { redis, connectRedis } from '@/config/redis';
import { initSocketServer } from '@/sockets/socketServer';
import { startNotificationsWorker } from '@/jobs/processors/notifications.processor';
import { startIndexationWorker } from '@/jobs/processors/indexation.processor';
import { startIndexationPersonnelleWorker } from '@/jobs/processors/indexationPersonnelle.processor';
import { startGenerationPdfWorker } from '@/jobs/processors/generationPdf.processor';
import { closeBrowser } from '@/utils/pdfGenerator';

async function main() {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const httpServer = createServer(app);

  await initSocketServer(httpServer);

  const workers = [
    startNotificationsWorker(),
    startIndexationWorker(),
    startIndexationPersonnelleWorker(),
    startGenerationPdfWorker(),
  ];

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 EduSmart API démarrée sur le port ${env.PORT} (${env.NODE_ENV})`);
  });

  async function shutdown(signal: string) {
    logger.info(`Signal ${signal} reçu, arrêt propre du serveur...`);
    httpServer.close();
    await Promise.all(workers.map((w) => w.close()));
    await closeBrowser();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, "Échec du démarrage du serveur EduSmart");
  process.exit(1);
});
