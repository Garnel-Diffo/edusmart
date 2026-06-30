'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';
import { statsApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, MessageCircle } from 'lucide-react';
import type { DashboardStats } from '@/types';

const COLORS = ['#1F4E79', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1e3a5f'];
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export default function AdminStatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'dashboard', 'full'],
    queryFn: () => statsApi.dashboard().then((r) => r.data.data as DashboardStats),
  });

  function exporter(format: 'csv' | 'pdf') {
    window.open(`${BACKEND_URL}/api/stats?format=${format}`, '_blank');
  }

  return (
    <div>
      <PageHeader
        title="Statistiques"
        description="Indicateurs de performance académique et d'activité de la plateforme"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exporter('csv')}><FileSpreadsheet className="h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exporter('pdf')}><Download className="h-4 w-4" /> PDF</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard label="Utilisateurs actifs" value={data?.utilisateursActifs ?? 0} icon={Users} color="brand" />
            <StatCard label="Cours déposés" value={data?.nbCoursDeposes ?? 0} icon={BookOpen} color="emerald" delay={0.05} />
            <StatCard label="Interactions chatbot" value={data?.activiteChatbot ?? 0} icon={MessageCircle} color="violet" delay={0.1} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Taux de réussite par filière</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.parFiliere ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="tauxReussite" name="Taux de réussite (%)" fill="#1F4E79" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Répartition des utilisateurs</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.repartitionRoles ?? []} dataKey="total" nameKey="role" cx="50%" cy="50%" outerRadius={100} label>
                      {(data?.repartitionRoles ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Moyennes générales par filière</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.parFiliere ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="moyenneGenerale" name="Moyenne générale /20" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
