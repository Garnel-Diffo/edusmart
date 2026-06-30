import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { authService } from '@/modules/auth/auth.service';
import { isProduction } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { uploadImageBuffer } from '@/utils/cloudinaryUpload';

const REFRESH_COOKIE_NAME = 'edusmart_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  // path: '/' (et non '/api/auth') : le frontend (autre origine/port en local,
  // sous-domaine en production) doit voir ce cookie sur TOUTES ses requêtes de
  // page pour que son middleware Next.js puisse détecter une session active,
  // pas seulement sur les appels vers /api/auth.
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
};

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, motDePasse } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(email, motDePasse, meta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    res.json({ success: true, accessToken, user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Aucune session active' } });

    const { accessToken, refreshToken, user } = await authService.refresh(rawToken, meta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    res.json({ success: true, accessToken, user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    res.json({ success: true, user });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.nouveauMotDePasse);
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.id, req.body.ancienMotDePasse, req.body.nouveauMotDePasse);
    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucune image reçue');
    const { secureUrl } = await uploadImageBuffer(req.file.buffer, 'edusmart/avatars', req.user!.id);
    const user = await authService.updateAvatar(req.user!.id, secureUrl);
    res.json({ success: true, user });
  }),
};
