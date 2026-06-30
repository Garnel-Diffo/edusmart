import { Router } from 'express';
import { authController } from '@/modules/auth/auth.controller';
import { authenticate } from '@/middlewares/authenticate';
import { validate } from '@/middlewares/validate';
import { loginRateLimiter } from '@/middlewares/rateLimiter';
import { uploadAvatar } from '@/middlewares/upload';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '@/modules/auth/auth.validation';

const router = Router();

router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', loginRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.post('/avatar', authenticate, uploadAvatar, authController.uploadAvatar);

export default router;
