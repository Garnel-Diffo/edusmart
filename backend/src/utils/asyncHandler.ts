import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Enveloppe un handler async pour transmettre automatiquement les rejets de
 * promesse au middleware d'erreur Express (`next(err)`), sans répéter de try/catch
 * dans chaque controller.
 */
export const asyncHandler = (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
