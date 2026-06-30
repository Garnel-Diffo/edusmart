import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { edtService } from '@/modules/edt/edt.service';
import { ApiError } from '@/utils/ApiError';

export const edtController = {
  get: asyncHandler(async (req: Request, res: Response) => {
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

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu');
    const { filiereId, semestre, anneeScolaire, titre } = req.body;
    const edt = await edtService.uploadEmploiDuTemps(
      { filiereId, semestre: Number(semestre), anneeScolaire, titre: titre || undefined },
      { buffer: req.file.buffer, mimetype: req.file.mimetype },
      req.user!.id,
    );
    res.status(201).json({ success: true, data: edt });
  }),
};
