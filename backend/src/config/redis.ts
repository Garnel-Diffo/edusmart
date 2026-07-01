import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Client Redis (Upstash) pour le cache applicatif (EDT, stats, listes de cours)
 * et le rate-limiting distribué. Upstash expose le protocole Redis natif via TLS
 * (rediss://), compatible ioredis sans configuration additionnelle.
 */
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true, // pas de connexion réseau au simple import du module (tests, etc.)
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on('connect', () => logger.info('✅ Connexion Redis (Upstash) établie'));
redis.on('error', (err) => logger.error({ err }, '❌ Erreur Redis'));

/** Connexion explicite au démarrage du serveur (src/server.ts) - fail-fast non bloquant. */
export async function connectRedis(): Promise<void> {
  if (redis.status !== 'wait') return; // déjà connecté/en cours (ex. redémarrage à chaud en dev)
  await redis.connect().catch((err) => {
    logger.error({ err }, "❌ Échec de connexion initiale à Redis, nouvelle tentative automatique en arrière-plan");
  });
}

/**
 * BullMQ exige une connexion ioredis dédiée avec `maxRetriesPerRequest: null`.
 * Utilisée par les files de jobs (notifications, indexation RAG, PDF par lot).
 */
export function createBullMQConnection() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

const DEFAULT_TTL_SECONDS = 300;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(keyOrPattern: string): Promise<void> {
  if (keyOrPattern.includes('*')) {
    const keys = await redis.keys(keyOrPattern);
    if (keys.length) await redis.del(...keys);
  } else {
    await redis.del(keyOrPattern);
  }
}
