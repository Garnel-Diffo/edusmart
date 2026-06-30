import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { env } from '@/config/env';
import type { RoleUtilisateur } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: RoleUtilisateur;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
}

/**
 * Le refresh token est un secret opaque aléatoire (pas un JWT) : seul son hash
 * SHA-256 est persisté en base (table refresh_token), ce qui permet la révocation
 * sans exposer de secret réutilisable en cas de fuite de la base.
 */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(48).toString('hex');
  const hash = hashRefreshToken(token);
  return { token, hash };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface PasswordResetPayload {
  sub: string;
  purpose: 'password_reset';
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: 'password_reset' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '30m',
    algorithm: 'HS256',
  });
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as PasswordResetPayload;
  if (payload.purpose !== 'password_reset') {
    throw new Error('Jeton invalide pour cette opération');
  }
  return payload;
}

export function refreshTokenExpiryDate(): Date {
  const match = /^(\d+)([dhm])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const amount = match ? Number(match[1]) : 30;
  const unit = match ? match[2] : 'd';
  const multiplier = unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : 60_000;
  return new Date(Date.now() + amount * multiplier);
}
