import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { iaService } from '@/modules/ia/ia.service';

export const iaController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    const reponse = await iaService.chat(req.user!, req.body.question);
    res.json({ success: true, data: reponse });
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const resultat = await iaService.search(req.user!, req.body.requete);
    res.json({ success: true, ...resultat });
  }),

  genererFiche: asyncHandler(async (req: Request, res: Response) => {
    const fiche = await iaService.demarrerGenerationFiche(req.user!, req.body);
    res.status(202).json({ success: true, data: fiche });
  }),

  getFiche: asyncHandler(async (req: Request, res: Response) => {
    const fiche = await iaService.getFiche(req.params.id, req.user!.id);
    res.json({ success: true, data: fiche });
  }),

  exporterFichePdf: asyncHandler(async (req: Request, res: Response) => {
    const url = await iaService.exporterFichePdf(req.params.id, req.user!.id);
    res.json({ success: true, data: { url } });
  }),

  ficheCallback: asyncHandler(async (req: Request, res: Response) => {
    await iaService.traiterCallbackFiche(req.body);
    res.json({ success: true });
  }),
};
