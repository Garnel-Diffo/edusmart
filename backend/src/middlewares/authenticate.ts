import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { verifyAccessToken } from '@/utils/jwt';

/**
 * Vérifie le token JWT d'accès (Authorization: Bearer <token>). Le refresh token,
 * lui, est transmis en cookie HttpOnly et n'est lu que par /api/auth/refresh.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Session expirée ou invalide, veuillez vous reconnecter'));
  }
}

/**
 * Authentification optionnelle : peuple req.user si un token valide est fourni,
 * mais laisse passer la requête sinon (utile pour des routes publiques enrichies).
 */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // Token invalide : on ignore silencieusement, la route reste accessible anonymement.
  }
  next();
}
