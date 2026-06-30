'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/page-header';
import { EdtViewer } from '@/components/shared/edt-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { edtApi } from '@/lib/api';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_EDT_OPTIONS } from '@/lib/academic-period';
import type { EmploiDuTemps } from '@/types';

export default function EtudiantEdtPage() {
  const [semestre, setSemestre] = useState(1);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());

  const { data, isLoading } = useQuery({
    queryKey: ['edt', 'etudiant', semestre, anneeScolaire],
    queryFn: () => edtApi.get({ semestre, anneeScolaire }).then((r) => r.data.data as EmploiDuTemps | null),
  });

  return (
    <div>
      <PageHeader
        title="Emploi du temps"
        description="L'emploi du temps de votre filière pour le semestre sélectionné"
        action={
          <div className="flex gap-2">
            <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTRE_EDT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anneeScolaireOptions().map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading ? <Skeleton className="h-64 w-full" /> : <EdtViewer edt={data} />}
    </div>
  );
}
