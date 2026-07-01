import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { notesController } from '@/modules/notes/notes.controller';
import { bulletinsController } from '@/modules/bulletins/bulletins.controller';
import { saisirNotesSchema, validerNotesSchema, refuserValidationSchema, consulterNotesQuerySchema } from '@/modules/notes/notes.validation';

const router = Router();

router.use(authenticate);

router.get('/etudiant', authorize('ETUDIANT'), validate({ query: consulterNotesQuerySchema }), notesController.consulterEtudiant);
router.get('/bulletin', authorize('ETUDIANT'), bulletinsController.monBulletin);
router.get('/etudiants', authorize('ENSEIGNANT'), notesController.listEtudiants);
router.get('/session', authorize('ENSEIGNANT'), notesController.getNotesSession);
router.post('/saisir', authorize('ENSEIGNANT'), validate({ body: saisirNotesSchema }), notesController.saisir);
router.get('/sessions-en-attente', authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'), notesController.listSessionsEnAttente);
router.put('/valider', authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'), validate({ body: validerNotesSchema }), notesController.valider);
router.put('/refuser', authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN'), validate({ body: refuserValidationSchema }), notesController.refuser);

export default router;
