import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { adminController } from '@/modules/admin/admin.controller';
import { createUtilisateurSchema, updateUtilisateurSchema, createInscriptionSchema } from '@/modules/admin/admin.validation';

const router = Router();

router.use(authenticate, authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'));

router.get('/utilisateurs', adminController.listUtilisateurs);
router.get('/utilisateurs/:id', adminController.getUtilisateur);
router.post('/utilisateurs', validate({ body: createUtilisateurSchema }), adminController.createUtilisateur);
router.put('/utilisateurs/:id', validate({ body: updateUtilisateurSchema }), adminController.updateUtilisateur);

router.post('/inscriptions', validate({ body: createInscriptionSchema }), adminController.createInscription);

export default router;
