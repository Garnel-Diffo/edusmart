import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { structuresService } from '@/modules/structures/structures.service';

export const structuresController = {
  // Filière
  listFilieres: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.filiere.list() });
  }),
  getFiliere: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.filiere.get(req.params.id) });
  }),
  createFiliere: asyncHandler(async (req: Request, res: Response) => {
    const created = await structuresService.filiere.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: created });
  }),
  updateFiliere: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.filiere.update(req.params.id, req.body, req.user!.id) });
  }),
  removeFiliere: asyncHandler(async (req: Request, res: Response) => {
    await structuresService.filiere.remove(req.params.id, req.user!.id);
    res.status(204).send();
  }),

  // Module
  listModules: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.module.list(req.query.filiereId as string | undefined) });
  }),
  getModule: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.module.get(req.params.id) });
  }),
  createModule: asyncHandler(async (req: Request, res: Response) => {
    const created = await structuresService.module.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: created });
  }),
  updateModule: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.module.update(req.params.id, req.body, req.user!.id) });
  }),
  removeModule: asyncHandler(async (req: Request, res: Response) => {
    await structuresService.module.remove(req.params.id, req.user!.id);
    res.status(204).send();
  }),

  // Matière
  listMatieres: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.matiere.list(req.query.moduleId as string | undefined) });
  }),
  getMatiere: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.matiere.get(req.params.id) });
  }),
  createMatiere: asyncHandler(async (req: Request, res: Response) => {
    const created = await structuresService.matiere.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: created });
  }),
  updateMatiere: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.matiere.update(req.params.id, req.body, req.user!.id) });
  }),
  removeMatiere: asyncHandler(async (req: Request, res: Response) => {
    await structuresService.matiere.remove(req.params.id, req.user!.id);
    res.status(204).send();
  }),

  // Salle
  listSalles: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.salle.list(req.query.type as never) });
  }),
  getSalle: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.salle.get(req.params.id) });
  }),
  createSalle: asyncHandler(async (req: Request, res: Response) => {
    const created = await structuresService.salle.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: created });
  }),
  updateSalle: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await structuresService.salle.update(req.params.id, req.body, req.user!.id) });
  }),
  removeSalle: asyncHandler(async (req: Request, res: Response) => {
    await structuresService.salle.remove(req.params.id, req.user!.id);
    res.status(204).send();
  }),
};
