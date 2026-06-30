'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { edtApi, adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EdtViewer } from '@/components/shared/edt-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_EDT_OPTIONS } from '@/lib/academic-period';
import type { Filiere, EmploiDuTemps } from '@/types';

export default function AdminEdtPage() {
  const qc = useQueryClient();
  const [filiereId, setFiliereId] = useState('');
  const [semestre, setSemestre] = useState(1);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());
  const [fichier, setFichier] = useState<File | null>(null);

  const { data: filieres } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });

  const { data: edt, isLoading } = useQuery({
    queryKey: ['edt', filiereId, semestre, anneeScolaire],
    queryFn: () => edtApi.get({ filiereId, semestre, anneeScolaire }).then((r) => r.data.data as EmploiDuTemps | null),
    enabled: !!filiereId,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('filiereId', filiereId);
      formData.append('semestre', String(semestre));
      formData.append('anneeScolaire', anneeScolaire);
      formData.append('fichier', fichier!);
      return edtApi.upload(formData);
    },
    onSuccess: () => {
      toast.success('Emploi du temps déposé');
      qc.invalidateQueries({ queryKey: ['edt'] });
      setFichier(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec du dépôt';
      toast.error(message);
    },
  });

  return (
    <div>
      <PageHeader title="Gestion de l'emploi du temps" description="Déposez le fichier (image ou PDF) de l'emploi du temps par filière et semestre" />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Filière</Label>
            <Select value={filiereId} onValueChange={setFiliereId}>
              <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
              <SelectContent>{filieres?.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom} — {f.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Semestre</Label>
            <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEMESTRE_EDT_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Année scolaire</Label>
            <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{anneeScolaireOptions().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!filiereId ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8" />
          <p>Sélectionnez une filière pour afficher ou déposer l&apos;emploi du temps</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                className="flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
              <Button loading={uploadMutation.isPending} disabled={!fichier} onClick={() => uploadMutation.mutate()}>
                <Upload className="h-4 w-4" /> Déposer
              </Button>
            </CardContent>
          </Card>

          {!isLoading && <EdtViewer edt={edt} />}
        </div>
      )}
    </div>
  );
}
