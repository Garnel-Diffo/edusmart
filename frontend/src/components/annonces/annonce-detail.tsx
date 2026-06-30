'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Megaphone, Paperclip } from 'lucide-react';
import { annoncesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateTime, getInitials } from '@/lib/utils';
import type { Annonce, PaginatedResponse } from '@/types';

const CIBLE_LABELS: Record<string, string> = {
  TOUS: 'Toute la plateforme',
  FILIERE: 'Filière',
  MODULE: 'Module',
  ETUDIANT: 'Personnel',
};

/** Vue de détail réutilisée par les 3 espaces (étudiant/enseignant/admin). */
export function AnnonceDetail({ id, backHref }: { id: string; backHref: string }) {
  const router = useRouter();

  // Réutilise le cache de la page liste (['annonces', 'list']) si déjà chargé,
  // sinon refait l'appel — pas d'endpoint dédié /annonces/:id côté backend,
  // le volume d'annonces reste faible pour ce périmètre.
  const { data, isLoading } = useQuery({
    queryKey: ['annonces', 'list'],
    queryFn: () => annoncesApi.list({ pageSize: 100 }).then((r) => r.data as PaginatedResponse<Annonce>),
  });

  const annonce = data?.data.find((a) => a.id === id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!annonce) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Megaphone} title="Annonce introuvable" action={<Link href={backHref} className="text-sm text-primary hover:underline">Retour aux annonces</Link>} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-tight">{annonce.titre}</h1>
            <Badge>{CIBLE_LABELS[annonce.cible] ?? annonce.cible}</Badge>
          </div>

          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <Avatar><AvatarFallback>{getInitials(annonce.auteur.nom, annonce.auteur.prenom)}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium">{annonce.auteur.prenom} {annonce.auteur.nom}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(annonce.datePublication)}</p>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed">{annonce.contenu}</p>

          {annonce.fichierUrl && (
            <div className="mt-5 border-t pt-4">
              {annonce.fichierFormat?.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element -- image Cloudinary externe
                <img src={annonce.fichierUrl} alt={annonce.fichierNomOriginal ?? 'Pièce jointe'} className="max-h-96 w-full rounded-lg object-contain" />
              ) : (
                <a
                  href={annonce.fichierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                >
                  <Paperclip className="h-4 w-4" /> {annonce.fichierNomOriginal ?? 'Pièce jointe'}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
