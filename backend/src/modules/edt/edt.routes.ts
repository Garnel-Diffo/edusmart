import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { uploadEmploiDuTemps } from '@/middlewares/upload';
import { edtController } from '@/modules/edt/edt.controller';
import { getEmploiDuTempsQuerySchema, uploadEmploiDuTempsSchema } from '@/modules/edt/edt.validation';

const router = Router();
const adminOnly = authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN');

router.use(authenticate);

router.get('/', validate({ query: getEmploiDuTempsQuerySchema }), edtController.get);
router.post('/', adminOnly, uploadEmploiDuTemps, validate({ body: uploadEmploiDuTempsSchema }), edtController.upload);

export default router;
