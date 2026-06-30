import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { annoncesService } from '@/modules/annonces/annonces.service';

export const annoncesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await annoncesService.list(req.user!, req.query);
    res.json({ success: true, ...result });
  }),

  publier: asyncHandler(async (req: Request, res: Response) => {
    const fichier = req.file
      ? { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size, originalname: req.file.originalname }
      : undefined;
    const annonce = await annoncesService.publier(req.user!, req.body, fichier);
    res.status(201).json({ success: true, data: annonce });
  }),
};
