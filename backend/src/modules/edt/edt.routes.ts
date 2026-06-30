import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { edtController } from '@/modules/edt/edt.controller';
import { getEmploiDuTempsQuerySchema, createSeanceSchema, updateSeanceSchema } from '@/modules/edt/edt.validation';
import { z } from 'zod';

const router = Router();
const adminOnly = authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN');

router.use(authenticate);

router.get(
  '/',
  (req, res, next) => (req.query.moi === 'true' ? next() : validate({ query: getEmploiDuTempsQuerySchema })(req, res, next)),
  edtController.get,
);

router.post(
  '/',
  adminOnly,
  validate({
    body: z.object({ filiereId: z.string().min(1), semestre: z.coerce.number().int().min(1).max(12), anneeScolaire: z.string() }),
  }),
  edtController.createEmploiDuTemps,
);

router.post('/:emploiDuTempsId/seances', adminOnly, validate({ body: createSeanceSchema }), edtController.addSeance);
router.put('/seances/:seanceId', adminOnly, validate({ body: updateSeanceSchema }), edtController.updateSeance);
router.delete('/seances/:seanceId', adminOnly, edtController.deleteSeance);

export default router;
