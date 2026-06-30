import type { NextFunction, Request, Response } from 'express';
import type { RoleUtilisateur } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';

/**
 * Middleware RBAC : restreint une route à un ensemble de rôles. À utiliser après
 * `authenticate`. Exemple : `router.post('/x', authenticate, authorize('ADMIN_SCOLAIRE'), ...)`
 */
export function authorize(...allowedRoles: RoleUtilisateur[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Vous n\'avez pas les droits requis pour cette action'));
    }
    next();
  };
}
