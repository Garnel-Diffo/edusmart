'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, MessageCircle, TrendingUp, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { statsApi } from '@/lib/api';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => statsApi.dashboard().then((r) => r.data.data as DashboardStats),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-lg text-muted-foreground">
          Bonjour, <span className="font-semibold text-foreground">{user?.prenom}</span> 👋
        </h2>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de la plateforme EduSmart</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Utilisateurs actifs" value={isLoading ? '—' : data?.utilisateursActifs ?? 0} icon={Users} color="brand" />
        <StatCard label="Cours déposés" value={isLoading ? '—' : data?.nbCoursDeposes ?? 0} icon={BookOpen} color="emerald" delay={0.05} />
        <StatCard label="Interactions chatbot" value={isLoading ? '—' : data?.activiteChatbot ?? 0} icon={MessageCircle} color="violet" delay={0.1} />
        <StatCard
          label="Taux réussite moyen"
          value={isLoading || !data?.parFiliere.length ? '—' : `${(data.parFiliere.reduce((a, f) => a + f.tauxReussite, 0) / data.parFiliere.length).toFixed(0)}%`}
          icon={TrendingUp}
          color="amber"
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Résultats par filière</CardTitle>
            <Link href="/admin/stats" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Détails <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.parFiliere.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée disponible</p>}
            {data?.parFiliere.map((f) => (
              <div key={f.filiereId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{f.nom}</p>
                  <p className="text-xs text-muted-foreground">{f.effectif} étudiants</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{f.tauxReussite}%</p>
                  <p className="text-xs text-muted-foreground">moy. {f.moyenneGenerale.toFixed(1)}/20</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Actions rapides</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nouvel utilisateur', href: '/admin/utilisateurs', icon: Users },
              { label: 'Valider des notes', href: '/admin/notes', icon: GraduationCap },
              { label: "Gérer l'EDT", href: '/admin/edt', icon: BookOpen },
              { label: 'Statistiques', href: '/admin/stats', icon: TrendingUp },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm transition-colors hover:bg-accent">
                <a.icon className="h-5 w-5 text-primary" /> {a.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
