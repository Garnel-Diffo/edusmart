import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { bulletinsController } from '@/modules/bulletins/bulletins.controller';
import { genererBulletinsSchema } from '@/modules/bulletins/bulletins.validation';

const router = Router();

router.use(authenticate, authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'));

router.post('/generer', validate({ body: genererBulletinsSchema }), bulletinsController.genererBulletins);

export default router;
