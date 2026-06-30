'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, CalendarDays, MessageCircle, ArrowRight, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { notesApi, coursApi, annoncesApi } from '@/lib/api';
import { currentAnneeScolaire } from '@/lib/academic-period';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { NotesResult, PaginatedResponse, CoursDocument, Annonce } from '@/types';

export default function EtudiantDashboardPage() {
  const { user } = useAuth();
  const anneeScolaire = currentAnneeScolaire();

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['notes', 'etudiant', 8, anneeScolaire],
    queryFn: () => notesApi.etudiant(8, anneeScolaire).then((r) => r.data.data as NotesResult),
  });

  const { data: cours, isLoading: loadingCours } = useQuery({
    queryKey: ['cours', 'recent'],
    queryFn: () => coursApi.list({ pageSize: 5 }).then((r) => r.data as PaginatedResponse<CoursDocument>),
  });

  const { data: annonces } = useQuery({
    queryKey: ['annonces', 'recent'],
    queryFn: () => annoncesApi.list({ pageSize: 3 }).then((r) => r.data as PaginatedResponse<Annonce>),
  });

  const filiereActive = user?.etudiant?.inscriptions?.[0]?.filiere;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-lg text-muted-foreground">
          Bonjour, <span className="font-semibold text-foreground">{user?.prenom}</span> 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          {filiereActive ? `${filiereActive.nom} — Niveau ${filiereActive.niveau}` : ''} — Matricule {user?.etudiant?.matricule}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Moyenne générale"
          value={loadingNotes ? '—' : `${notes?.moyenneGenerale.toFixed(2) ?? 0}/20`}
          icon={GraduationCap}
          color="brand"
          delay={0}
        />
        <StatCard
          label="Rang promotion"
          value={loadingNotes || !notes?.rang ? '—' : `${notes.rang}/${notes.effectifPromotion}`}
          icon={GraduationCap}
          color="violet"
          delay={0.05}
        />
        <StatCard label="Cours disponibles" value={loadingCours ? '—' : cours?.pagination.total ?? 0} icon={BookOpen} color="emerald" delay={0.1} />
        <StatCard label="Annonces" value={annonces?.pagination.total ?? 0} icon={Megaphone} color="amber" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Derniers cours déposés</CardTitle>
            <Link href="/etudiant/cours" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingCours &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            {!loadingCours && cours?.data.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun cours disponible pour le moment</p>
            )}
            {cours?.data.map((doc) => (
              <Link
                key={doc.id}
                href="/etudiant/cours"
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.titre}</p>
                    <p className="text-xs text-muted-foreground">{doc.matiere?.nom}</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{doc.format}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" /> Assistant IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Posez une question sur vos cours, générez une fiche de révision ou faites une recherche sémantique.
            </p>
            <Link
              href="/etudiant/chatbot"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg gradient-brand py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Démarrer une conversation
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Annonces récentes
          </CardTitle>
          <Link href="/etudiant/annonces" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {annonces?.data.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Aucune annonce</p>}
          {annonces?.data.map((a) => (
            <div key={a.id} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{a.titre}</p>
                <span className="text-xs text-muted-foreground">{formatDate(a.datePublication)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.contenu}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
