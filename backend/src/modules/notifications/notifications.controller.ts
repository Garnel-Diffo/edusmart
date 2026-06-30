import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { notificationsService } from '@/modules/notifications/notifications.service';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationsService.listForUser(req.user!.id, req.query);
    res.json({ success: true, ...result });
  }),

  countNonLues: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationsService.countNonLues(req.user!.id);
    res.json({ success: true, count });
  }),

  markLue: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markLue(req.params.id, req.user!.id);
    res.json({ success: true });
  }),

  markToutesLues: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markToutesLues(req.user!.id);
    res.json({ success: true });
  }),
};
