import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { notesService } from '@/modules/notes/notes.service';

export const notesController = {
  listEtudiants: asyncHandler(async (req: Request, res: Response) => {
    const etudiants = await notesService.listEtudiantsPourMatiere(req.user!.id, req.query.matiereId as string);
    res.json({ success: true, data: etudiants });
  }),

  saisir: asyncHandler(async (req: Request, res: Response) => {
    const resultats = await notesService.saisir(req.user!.id, req.body);
    res.status(201).json({ success: true, data: resultats });
  }),

  listSessionsEnAttente: asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await notesService.listSessionsEnAttenteValidation();
    res.json({ success: true, data: sessions });
  }),

  valider: asyncHandler(async (req: Request, res: Response) => {
    const { matiereId, semestre, anneeScolaire } = req.body;
    const result = await notesService.valider(req.user!.id, matiereId, semestre, anneeScolaire);
    res.json({ success: true, ...result });
  }),

  refuser: asyncHandler(async (req: Request, res: Response) => {
    const { matiereId, semestre, anneeScolaire, commentaire } = req.body;
    await notesService.refuserValidation(req.user!.id, matiereId, semestre, anneeScolaire, commentaire);
    res.json({ success: true });
  }),

  consulterEtudiant: asyncHandler(async (req: Request, res: Response) => {
    const { semestre, anneeScolaire } = req.query as unknown as { semestre: number; anneeScolaire: string };
    const result = await notesService.consulterPourEtudiant(req.user!.id, semestre, anneeScolaire);
    res.json({ success: true, data: result });
  }),
};
