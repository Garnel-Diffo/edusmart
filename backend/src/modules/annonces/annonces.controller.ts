import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { annoncesService } from '@/modules/annonces/annonces.service';

export const annoncesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await annoncesService.list(req.user!, req.query);
    res.json({ success: true, ...result });
  }),

  publier: asyncHandler(async (req: Request, res: Response) => {
    const annonce = await annoncesService.publier(req.user!, req.body);
    res.status(201).json({ success: true, data: annonce });
  }),
};
