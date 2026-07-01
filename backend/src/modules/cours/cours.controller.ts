import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { coursService } from '@/modules/cours/cours.service';
import { ApiError } from '@/utils/ApiError';

export const coursController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await coursService.list(
      req.user!,
      { matiereId: req.query.matiereId as string | undefined, moduleId: req.query.moduleId as string | undefined },
      req.query,
    );
    res.json({ success: true, ...result });
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu');
    const document = await coursService.upload(
      { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size, originalname: req.file.originalname },
      req.body,
      req.user!.id,
    );
    res.status(201).json({ success: true, data: document });
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const result = await coursService.getDownloadUrl(req.params.id, req.user!, req.ip);
    res.json({ success: true, data: result });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file
      ? { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size, originalname: req.file.originalname }
      : undefined;
    const updated = await coursService.updateDocument(req.params.id, req.user!.id, { titre: req.body.titre }, file);
    res.json({ success: true, data: updated });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await coursService.deleteDocument(req.params.id, req.user!.id);
    res.json({ success: true });
  }),
};
