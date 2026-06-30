import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { notificationsController } from '@/modules/notifications/notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.list);
router.get('/non-lues/count', notificationsController.countNonLues);
router.put('/:id/lue', notificationsController.markLue);
router.put('/lues/toutes', notificationsController.markToutesLues);

export default router;
