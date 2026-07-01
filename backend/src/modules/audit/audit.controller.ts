import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { auditService } from '@/modules/audit/audit.service';

export const auditController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await auditService.list(
      {
        action: req.query.action as string | undefined,
        entite: req.query.entite as string | undefined,
        utilisateurId: req.query.utilisateurId as string | undefined,
        dateDebut: req.query.dateDebut as string | undefined,
        dateFin: req.query.dateFin as string | undefined,
        q: req.query.q as string | undefined,
      },
      req.query,
    );
    res.json({ success: true, ...result });
  }),

  filterOptions: asyncHandler(async (_req: Request, res: Response) => {
    const options = await auditService.getFilterOptions();
    res.json({ success: true, data: options });
  }),
};
