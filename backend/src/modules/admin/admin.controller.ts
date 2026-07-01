import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { adminService } from '@/modules/admin/admin.service';
import type { RoleUtilisateur } from '@prisma/client';

export const adminController = {
  listUtilisateurs: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.list(
      { role: req.query.role as RoleUtilisateur | undefined, recherche: req.query.q as string | undefined },
      req.query,
    );
    res.json({ success: true, ...result });
  }),

  getUtilisateur: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await adminService.get(req.params.id) });
  }),

  createUtilisateur: asyncHandler(async (req: Request, res: Response) => {
    const created = await adminService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: created });
  }),

  updateUtilisateur: asyncHandler(async (req: Request, res: Response) => {
    const updated = await adminService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: updated });
  }),

  createInscription: asyncHandler(async (req: Request, res: Response) => {
    const inscription = await adminService.createInscription(req.body, req.user!.id);
    res.status(201).json({ success: true, data: inscription });
  }),

  setDelegue: asyncHandler(async (req: Request, res: Response) => {
    const updated = await adminService.setDelegue(req.params.id, req.body.estDelegue, req.user!.id);
    res.json({ success: true, data: updated });
  }),

  changerFiliere: asyncHandler(async (req: Request, res: Response) => {
    const inscription = await adminService.changerFiliere(req.params.id, req.body.filiereId, req.user!.id);
    res.json({ success: true, data: inscription });
  }),
};
