import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import { redis } from '@/config/redis';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

function buildStore(prefix: string) {
  return new RedisStore({
    // @ts-expect-error -- ioredis call signature is compatible with rate-limit-redis's expectations
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix,
  });
}

/**
 * Limite globale par utilisateur/IP : 100 req/min (NFR transversal du cahier).
 * Distribué via Redis pour rester correct avec plusieurs instances Render.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.RATE_LIMIT_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('rl:global:'),
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'anonymous',
  handler: (_req, _res, next) => next(ApiError.tooManyRequests()),
});

/**
 * Limite stricte sur /api/auth/login indépendante du verrouillage de compte
 * (UC0) : protège contre le credential stuffing distribué sur plusieurs comptes
 * depuis la même IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('rl:login:'),
  keyGenerator: (req: Request) => req.ip ?? 'anonymous',
  handler: (_req, _res, next) =>
    next(ApiError.tooManyRequests('Trop de tentatives de connexion depuis cette adresse, réessayez plus tard')),
});
