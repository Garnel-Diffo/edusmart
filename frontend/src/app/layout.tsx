import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: { template: '%s | EduSmart', default: 'EduSmart — Gestion scolaire intelligente' },
  description: "Plateforme numérique unifiée pour la gestion académique et l'intelligence artificielle pédagogique.",
  manifest: '/manifest.json',
  // Next.js App Router détecte automatiquement src/app/icon.tsx → <link rel="icon">
  // et src/app/apple-icon.tsx → <link rel="apple-touch-icon">.
  // On déclare ici le SVG (qualité maximale, toutes résolutions) et l'ICO legacy.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico',  sizes: '32x32',  type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#1e3a5f' },
    ],
  },
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
