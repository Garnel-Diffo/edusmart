import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { structuresController } from '@/modules/structures/structures.controller';
import { filiereSchema, moduleSchema, matiereSchema, salleSchema } from '@/modules/structures/structures.validation';

const router = Router();
const adminOnly = authorize('ADMIN_SCOLAIRE', 'SUPER_ADMIN');

router.use(authenticate);

// Filières
router.get('/filieres', structuresController.listFilieres);
router.get('/filieres/:id', structuresController.getFiliere);
router.post('/filieres', adminOnly, validate({ body: filiereSchema }), structuresController.createFiliere);
router.put('/filieres/:id', adminOnly, validate({ body: filiereSchema.partial() }), structuresController.updateFiliere);
router.delete('/filieres/:id', adminOnly, structuresController.removeFiliere);

// Modules
router.get('/modules', structuresController.listModules);
router.get('/modules/:id', structuresController.getModule);
router.post('/modules', adminOnly, validate({ body: moduleSchema }), structuresController.createModule);
router.put('/modules/:id', adminOnly, validate({ body: moduleSchema.partial() }), structuresController.updateModule);
router.delete('/modules/:id', adminOnly, structuresController.removeModule);

// Matières
router.get('/matieres', structuresController.listMatieres);
router.get('/matieres/:id', structuresController.getMatiere);
router.post('/matieres', adminOnly, validate({ body: matiereSchema }), structuresController.createMatiere);
router.put('/matieres/:id', adminOnly, validate({ body: matiereSchema.partial() }), structuresController.updateMatiere);
router.delete('/matieres/:id', adminOnly, structuresController.removeMatiere);

// Salles
router.get('/salles', structuresController.listSalles);
router.get('/salles/:id', structuresController.getSalle);
router.post('/salles', adminOnly, validate({ body: salleSchema }), structuresController.createSalle);
router.put('/salles/:id', adminOnly, validate({ body: salleSchema.partial() }), structuresController.updateSalle);
router.delete('/salles/:id', adminOnly, structuresController.removeSalle);

export default router;
