import type { NextFunction, Request, Response } from 'express';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

/**
 * Authentifie les appels serveur-à-serveur émis par le micro-service IA Python
 * (callbacks asynchrones), via un secret partagé - distinct de l'authentification
 * JWT utilisée par les utilisateurs finaux.
 */
export function verifyInternalSecret(req: Request, _res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret'];
  if (secret !== env.AI_SERVICE_SECRET) {
    return next(ApiError.unauthorized('Secret interne invalide'));
  }
  next();
}
