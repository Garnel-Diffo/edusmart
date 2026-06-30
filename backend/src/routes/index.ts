import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import adminRoutes from '@/modules/admin/admin.routes';
import structuresRoutes from '@/modules/structures/structures.routes';
import coursRoutes from '@/modules/cours/cours.routes';
import edtRoutes from '@/modules/edt/edt.routes';
import notesRoutes from '@/modules/notes/notes.routes';
import bulletinsRoutes from '@/modules/bulletins/bulletins.routes';
import annoncesRoutes from '@/modules/annonces/annonces.routes';
import messagerieRoutes from '@/modules/messagerie/messagerie.routes';
import notificationsRoutes from '@/modules/notifications/notifications.routes';
import statsRoutes from '@/modules/stats/stats.routes';
import iaRoutes from '@/modules/ia/ia.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/structures', structuresRoutes);
router.use('/cours', coursRoutes);
router.use('/edt', edtRoutes);
router.use('/notes', notesRoutes);
router.use('/admin/bulletins', bulletinsRoutes);
router.use('/annonces', annoncesRoutes);
router.use('/messages', messagerieRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/stats', statsRoutes);
router.use('/ia', iaRoutes);

export default router;
