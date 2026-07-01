import puppeteer, { type Browser } from 'puppeteer';
import { logger } from '@/config/logger';

let browserInstance: Browser | null = null;

/**
 * Réutilise une seule instance Chromium pour générer plusieurs PDF (bulletins
 * d'une promotion) plutôt que d'en lancer une par document - indispensable
 * pour tenir le NFR "200 bulletins en moins de 2 minutes" (UC11) sur un
 * service Render à ressources limitées.
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) return browserInstance;
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return browserInstance;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch((err) => logger.warn({ err }, 'Fermeture Puppeteer en erreur'));
    browserInstance = null;
  }
}
