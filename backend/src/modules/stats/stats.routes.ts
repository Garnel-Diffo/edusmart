import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { statsController } from '@/modules/stats/stats.controller';
import { statsQuerySchema } from '@/modules/stats/stats.validation';

const router = Router();

router.use(authenticate, authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN', 'DIRECTION'));

router.get('/', validate({ query: statsQuerySchema }), statsController.getDashboard);

export default router;
