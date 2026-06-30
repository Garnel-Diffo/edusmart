import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { messagerieController } from '@/modules/messagerie/messagerie.controller';

const router = Router();

router.use(authenticate, authorize('ETUDIANT'));

router.get('/canaux', messagerieController.listCanaux);
router.get('/canaux/:canalId/historique', messagerieController.getHistorique);

export default router;
