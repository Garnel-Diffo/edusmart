'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Upload, CalendarDays, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { coursApi } from '@/lib/api';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaginatedResponse, CoursDocument } from '@/types';

export default function EnseignantDashboardPage() {
  const { user } = useAuth();

  const { data: cours } = useQuery({
    queryKey: ['cours', 'enseignant'],
    queryFn: () => coursApi.list({ pageSize: 5 }).then((r) => r.data as PaginatedResponse<CoursDocument>),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-lg text-muted-foreground">
          Bonjour, <span className="font-semibold text-foreground">{user?.prenom}</span> 👋
        </h2>
        <p className="text-sm text-muted-foreground">{user?.enseignant?.specialite ?? 'Enseignant'}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Documents déposés" value={cours?.pagination.total ?? 0} icon={BookOpen} color="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Mes derniers dépôts</CardTitle>
            <Link href="/enseignant/cours" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Gérer <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {cours?.data.length === 0 && (
              <Link href="/enseignant/cours" className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:bg-accent">
                <Upload className="h-4 w-4" /> Déposer votre premier support de cours
              </Link>
            )}
            {cours?.data.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg px-3 py-2.5">
                <p className="truncate text-sm font-medium">{doc.titre}</p>
                <span className="text-xs text-muted-foreground">{doc.matiere?.nom}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Emploi du temps</CardTitle></CardHeader>
          <CardContent>
            <Link href="/enseignant/edt" className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:bg-accent">
              <CalendarDays className="h-4 w-4" /> Consulter l&apos;emploi du temps d&apos;une filière
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
