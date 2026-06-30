import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';
import { isProduction } from '@/config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} introuvable`));
}

/**
 * Middleware d'erreur centralisé. Traduit les erreurs connues (ApiError, erreurs
 * Prisma) en réponses HTTP normalisées et journalise systématiquement les
 * erreurs serveur (5xx) avec leur contexte.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const apiError = toApiError(err);

  if (apiError.statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method, userId: req.user?.id }, apiError.message);
  } else {
    logger.warn({ path: req.originalUrl, method: req.method, code: apiError.code }, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: isProduction && apiError.statusCode >= 500 ? undefined : apiError.details,
    },
  });
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiError.badRequest('Le fichier dépasse la taille maximale autorisée (50 Mo)'); // UC3 - 4b
    }
    return ApiError.badRequest(`Erreur de téléversement : ${err.message}`);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return ApiError.conflict('Une ressource avec ces informations existe déjà', err.meta);
    }
    if (err.code === 'P2025') {
      return ApiError.notFound('Ressource introuvable');
    }
  }

  const message = err instanceof Error ? err.message : 'Erreur inattendue';
  return ApiError.internal(isProduction ? 'Erreur interne du serveur' : message);
}
