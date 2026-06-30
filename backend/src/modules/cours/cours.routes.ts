import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { uploadCoursDocument } from '@/middlewares/upload';
import { coursController } from '@/modules/cours/cours.controller';
import { uploadCoursSchema, listCoursQuerySchema } from '@/modules/cours/cours.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listCoursQuerySchema }), coursController.list);
router.get('/:id/download', authorize('ETUDIANT'), coursController.download);
router.post(
  '/upload',
  authorize('ENSEIGNANT'),
  uploadCoursDocument,
  validate({ body: uploadCoursSchema }),
  coursController.upload,
);

export default router;
