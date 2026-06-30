import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { uploadAnnonceFichier } from '@/middlewares/upload';
import { annoncesController } from '@/modules/annonces/annonces.controller';
import { createAnnonceSchema, listAnnoncesQuerySchema } from '@/modules/annonces/annonces.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listAnnoncesQuerySchema }), annoncesController.list);
router.post(
  '/',
  authorize('ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE', 'SUPER_ADMIN', 'DIRECTION'),
  uploadAnnonceFichier,
  validate({ body: createAnnonceSchema }),
  annoncesController.publier,
);

export default router;
