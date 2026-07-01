'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, GraduationCap, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { notesApi } from '@/lib/api';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_OPTIONS } from '@/lib/academic-period';
import type { NotesResult, BulletinSemestre } from '@/types';

function moyenneColor(moyenne: number): string {
  if (moyenne >= 16) return 'text-emerald-600';
  if (moyenne >= 12) return 'text-primary';
  if (moyenne >= 10) return 'text-amber-600';
  return 'text-destructive';
}

export default function EtudiantNotesPage() {
  const [semestre, setSemestre] = useState(1);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());

  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'etudiant', semestre, anneeScolaire],
    queryFn: () => notesApi.etudiant(semestre, anneeScolaire).then((r) => r.data.data as NotesResult),
  });

  const { data: bulletin } = useQuery({
    queryKey: ['notes', 'bulletin', semestre, anneeScolaire],
    queryFn: () => notesApi.bulletin(semestre, anneeScolaire).then((r) => r.data.data as BulletinSemestre).catch(() => null),
  });

  return (
    <div>
      <PageHeader
        title="Mes notes"
        description="Résultats validés par semestre, avec classement dans la promotion"
        action={
          <div className="flex gap-2">
            <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{SEMESTRE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{anneeScolaireOptions().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : data && data.matieres.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <GraduationCap className={`h-8 w-8 ${moyenneColor(data.moyenneGenerale)}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Moyenne générale</p>
                  <p className={`text-xl font-bold ${moyenneColor(data.moyenneGenerale)}`}>{data.moyenneGenerale.toFixed(2)}/20</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="h-8 w-8 text-violet-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Rang promotion</p>
                  <p className="text-xl font-bold">{data.rang ?? '—'}<span className="text-sm font-normal text-muted-foreground">/{data.effectifPromotion}</span></p>
                </div>
              </CardContent>
            </Card>
            {bulletin?.pdfCloudinaryUrl && (
              <Card className="flex items-center justify-center">
                <Button variant="outline" size="sm" onClick={() => window.open(bulletin.pdfCloudinaryUrl!, '_blank')}>
                  <Download className="h-4 w-4" /> Bulletin PDF
                </Button>
              </Card>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Matière</th>
                  <th className="px-4 py-3 text-center">Coeff.</th>
                  <th className="px-4 py-3 text-center">ECTS</th>
                  <th className="px-4 py-3 text-right">Moyenne</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.matieres.map((m, i) => (
                  <motion.tr key={m.matiereId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.nom}</p>
                      <p className="text-xs text-muted-foreground">{m.code}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{m.coefficient}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{m.creditsEcts}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${moyenneColor(m.moyenne)}`}>{m.moyenne.toFixed(2)}/20</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="Aucune note disponible" description="Aucune note n'a encore été validée pour ce semestre." />
      )}
    </div>
  );
}
