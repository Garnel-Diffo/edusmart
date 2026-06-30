import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { edtService } from '@/modules/edt/edt.service';
import { ApiError } from '@/utils/ApiError';

export const edtController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role === 'ENSEIGNANT' && req.query.moi === 'true') {
      const seances = await edtService.getForEnseignant(req.user!.id);
      return res.json({ success: true, data: { seances } });
    }

    let { filiereId } = req.query as { filiereId?: string };
    const { semestre, anneeScolaire } = req.query as unknown as { semestre: number; anneeScolaire: string };

    // UC5 - l'étudiant n'a pas à connaître/sélectionner sa propre filière : elle est déduite de son inscription.
    if (req.user!.role === 'ETUDIANT' && !filiereId) {
      const inferred = await edtService.getFiliereIdPourEtudiant(req.user!.id);
      if (!inferred) return res.json({ success: true, data: null });
      filiereId = inferred;
    }

    if (!filiereId) throw ApiError.badRequest('filiereId requis');

    const edt = await edtService.getForFiliere(filiereId, semestre, anneeScolaire);
    res.json({ success: true, data: edt });
  }),

  createEmploiDuTemps: asyncHandler(async (req: Request, res: Response) => {
    const { filiereId, semestre, anneeScolaire } = req.body;
    const edt = await edtService.ensureEmploiDuTemps(filiereId, semestre, anneeScolaire, req.user!.id);
    res.status(201).json({ success: true, data: edt });
  }),

  addSeance: asyncHandler(async (req: Request, res: Response) => {
    const seance = await edtService.addSeance(req.params.emploiDuTempsId, req.body, req.user!.id);
    res.status(201).json({ success: true, data: seance });
  }),

  updateSeance: asyncHandler(async (req: Request, res: Response) => {
    const seance = await edtService.updateSeance(req.params.seanceId, req.body, req.user!.id);
    res.json({ success: true, data: seance });
  }),

  deleteSeance: asyncHandler(async (req: Request, res: Response) => {
    if (req.query.confirm !== 'true') {
      throw ApiError.badRequest('Confirmation requise pour supprimer une séance (paramètre confirm=true)'); // UC6 - 4b
    }
    await edtService.deleteSeance(req.params.seanceId, req.user!.id);
    res.status(204).send();
  }),
};
