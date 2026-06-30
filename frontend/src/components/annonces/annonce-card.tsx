'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Megaphone, Building2, Layers, User as UserIcon, Globe, Paperclip } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDateTime, getInitials, cn } from '@/lib/utils';
import type { Annonce } from '@/types';

const CIBLE_CONFIG: Record<Annonce['cible'], { label: string; icon: typeof Globe; variant: 'default' | 'secondary' | 'outline' }> = {
  TOUS: { label: 'Toute la plateforme', icon: Globe, variant: 'default' },
  FILIERE: { label: 'Filière', icon: Building2, variant: 'secondary' },
  MODULE: { label: 'Module', icon: Layers, variant: 'secondary' },
  ETUDIANT: { label: 'Personnel', icon: UserIcon, variant: 'outline' },
};

interface AnnonceCardProps {
  annonce: Annonce;
  href?: string;
  index?: number;
  compact?: boolean;
}

export function AnnonceCard({ annonce, href, index = 0, compact = false }: AnnonceCardProps) {
  const cible = CIBLE_CONFIG[annonce.cible];
  const CibleIcon = cible.icon;

  const content = (
    <Card className={cn('h-full transition-all hover:shadow-md', href && 'cursor-pointer hover:border-primary/40')}>
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{annonce.titre}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {formatDateTime(annonce.datePublication)}
                {annonce.fichierUrl && <Paperclip className="h-3 w-3" />}
              </p>
            </div>
          </div>
          <Badge variant={cible.variant} className="shrink-0 gap-1 whitespace-nowrap">
            <CibleIcon className="h-3 w-3" /> {cible.label}
          </Badge>
        </div>

        <p className={cn('flex-1 text-sm text-muted-foreground', compact ? 'line-clamp-2' : 'line-clamp-3')}>
          {annonce.contenu}
        </p>

        <div className="flex items-center gap-2 border-t pt-3">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{getInitials(annonce.auteur.nom, annonce.auteur.prenom)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {annonce.auteur.prenom} {annonce.auteur.nom}
            {annonce.filiere && ` · ${annonce.filiere.nom}`}
            {annonce.module && ` · ${annonce.module.nom}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.4) }}>
      {href ? <Link href={href}>{content}</Link> : content}
    </motion.div>
  );
}
