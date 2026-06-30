import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { messagerieService } from '@/modules/messagerie/messagerie.service';

export const messagerieController = {
  listCanaux: asyncHandler(async (req: Request, res: Response) => {
    const canaux = await messagerieService.listCanaux(req.user!.id);
    res.json({ success: true, data: canaux });
  }),

  getHistorique: asyncHandler(async (req: Request, res: Response) => {
    const messages = await messagerieService.getHistorique(req.user!.id, req.params.canalId);
    res.json({ success: true, data: messages });
  }),
};
