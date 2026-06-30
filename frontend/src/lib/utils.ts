import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', options ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(date),
  );
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  );
}

export function formatRelativeTime(date: string | Date): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, 'hour');
  return rtf.format(Math.round(diffH / 24), 'day');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  ETUDIANT: 'Étudiant',
  ENSEIGNANT: 'Enseignant',
  ADMIN_SCOLAIRE: 'Administrateur',
  SUPER_ADMIN: 'Super Administrateur',
  DIRECTION: 'Direction',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

