import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { verifyInternalSecret } from '@/middlewares/internalAuth';
import { iaController } from '@/modules/ia/ia.controller';
import { chatSchema, searchSchema, ficheSchema, ficheCallbackSchema } from '@/modules/ia/ia.validation';

const router = Router();

// Callback interne du service IA Python (secret partagé, pas de JWT utilisateur).
router.post('/fiche/callback', verifyInternalSecret, validate({ body: ficheCallbackSchema }), iaController.ficheCallback);

router.use(authenticate);

router.post('/chat', authorize('ETUDIANT', 'ENSEIGNANT'), validate({ body: chatSchema }), iaController.chat);
router.post('/search', authorize('ETUDIANT'), validate({ body: searchSchema }), iaController.search);
router.post('/fiche', authorize('ETUDIANT'), validate({ body: ficheSchema }), iaController.genererFiche);
router.get('/fiche/:id', authorize('ETUDIANT'), iaController.getFiche);
router.get('/fiche/:id/pdf', authorize('ETUDIANT'), iaController.exporterFichePdf);

export default router;
