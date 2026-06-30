import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: { template: '%s | EduSmart', default: 'EduSmart — Gestion scolaire intelligente' },
  description: 'Plateforme numérique unifiée pour la gestion académique et l\'intelligence artificielle pédagogique.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1F4E79' },
    { media: '(prefers-color-scheme: dark)', color: '#1e3a5f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
