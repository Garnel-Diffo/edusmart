import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { env } from '@/config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Génère un mot de passe temporaire lisible (utilisé lors de la création d'un
 * compte par l'admin, envoyé par email via Brevo).
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}
