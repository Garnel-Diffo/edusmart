import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { documentsPersonnelsService } from '@/modules/documentsPersonnels/documentsPersonnels.service';
import { ApiError } from '@/utils/ApiError';

export const documentsPersonnelsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await documentsPersonnelsService.list(req.user!.id);
    res.json({ success: true, data });
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu');
    const document = await documentsPersonnelsService.upload(
      { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size, originalname: req.file.originalname },
      req.body,
      req.user!.id,
    );
    res.status(201).json({ success: true, data: document });
  }),
};
