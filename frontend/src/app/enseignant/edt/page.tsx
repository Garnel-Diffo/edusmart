'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EdtViewer } from '@/components/shared/edt-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { edtApi, adminApi } from '@/lib/api';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_EDT_OPTIONS } from '@/lib/academic-period';
import type { Filiere, EmploiDuTemps } from '@/types';

export default function EnseignantEdtPage() {
  const [filiereId, setFiliereId] = useState('');
  const [semestre, setSemestre] = useState(1);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());

  const { data: filieres } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });

  const { data, isLoading } = useQuery({
    queryKey: ['edt', filiereId, semestre, anneeScolaire],
    queryFn: () => edtApi.get({ filiereId, semestre, anneeScolaire }).then((r) => r.data.data as EmploiDuTemps | null),
    enabled: !!filiereId,
  });

  return (
    <div>
      <PageHeader title="Emploi du temps" description="Consultez l'emploi du temps d'une filière" />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <Select value={filiereId} onValueChange={setFiliereId}>
            <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
            <SelectContent>{filieres?.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom} — {f.code}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SEMESTRE_EDT_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{anneeScolaireOptions().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!filiereId ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8" />
          <p>Sélectionnez une filière pour afficher l&apos;emploi du temps</p>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <EdtViewer edt={data} />
      )}
    </div>
  );
}
