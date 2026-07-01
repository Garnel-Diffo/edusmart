import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { auditController } from '@/modules/audit/audit.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'));

router.get('/', auditController.list);
router.get('/filter-options', auditController.filterOptions);

export default router;
