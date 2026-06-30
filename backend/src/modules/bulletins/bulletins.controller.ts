import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { bulletinsService } from '@/modules/bulletins/bulletins.service';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

export const bulletinsController = {
  genererBulletins: asyncHandler(async (req: Request, res: Response) => {
    const { filiereId, niveau, semestre, anneeScolaire } = req.body;
    const result = await bulletinsService.lancerGeneration(filiereId, niveau, semestre, anneeScolaire, req.user!.id);
    res.status(202).json({ success: true, ...result });
  }),

  monBulletin: asyncHandler(async (req: Request, res: Response) => {
    const { semestre, anneeScolaire } = req.query as unknown as { semestre: number; anneeScolaire: string };
    const bulletin = await prisma.bulletinSemestre.findUnique({
      where: { etudiantId_semestre_anneeScolaire: { etudiantId: req.user!.id, semestre: Number(semestre), anneeScolaire } },
    });
    if (!bulletin) throw ApiError.notFound('Bulletin non encore disponible pour ce semestre');
    res.json({ success: true, data: bulletin });
  }),
};
