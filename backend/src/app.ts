import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import routes from '@/routes';
import { corsAllowedOrigins } from '@/config/env';
import { logger } from '@/config/logger';
import { globalRateLimiter } from '@/middlewares/rateLimiter';
import { notFoundHandler, errorHandler } from '@/middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1); // Render est derrière un proxy inverse (IP réelle pour le rate-limit/logs)

  app.use(helmet());
  app.use(
    cors({
      origin: corsAllowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.use('/api', globalRateLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
