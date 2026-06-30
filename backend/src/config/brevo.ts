import axios from 'axios';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

const brevoClient = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'api-key': env.BREVO_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10_000,
});

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

/**
 * Envoie un email transactionnel via l'API HTTP Brevo. Les erreurs sont
 * journalisées mais ne font jamais échouer le flux appelant : un email est un
 * canal de notification parmi d'autres (cf. NotificationService / file BullMQ
 * pour les retentatives).
 */
export async function sendEmail({ to, subject, htmlContent }: SendEmailParams): Promise<boolean> {
  try {
    await brevoClient.post('/smtp/email', {
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
      to,
      subject,
      htmlContent,
    });
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Échec d'envoi d'email via Brevo");
    return false;
  }
}
