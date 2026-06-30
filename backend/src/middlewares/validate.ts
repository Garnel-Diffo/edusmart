import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError } from '@/utils/ApiError';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Valide body/query/params avec Zod et remplace les valeurs brutes par les
 * valeurs typées/transformées (coercion, valeurs par défaut). En cas d'échec,
 * renvoie 400 avec le détail champ par champ.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      const details = err instanceof ZodError ? err.flatten() : err instanceof Error ? err.message : undefined;
      next(ApiError.badRequest('Données de requête invalides', details));
    }
  };
}
