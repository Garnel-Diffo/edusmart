import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { uploadDocumentPersonnel } from '@/middlewares/upload';
import { documentsPersonnelsController } from '@/modules/documentsPersonnels/documentsPersonnels.controller';
import { uploadDocumentPersonnelSchema } from '@/modules/documentsPersonnels/documentsPersonnels.validation';

const router = Router();

router.use(authenticate, authorize('ETUDIANT'));

router.get('/', documentsPersonnelsController.list);
router.post(
  '/upload',
  uploadDocumentPersonnel,
  validate({ body: uploadDocumentPersonnelSchema }),
  documentsPersonnelsController.upload,
);

export default router;
