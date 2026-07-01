'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileBadge, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { bulletinsApi, adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_OPTIONS } from '@/lib/academic-period';
import type { Filiere } from '@/types';

interface MatiereIncomplete { id: string; nom: string }

export default function AdminBulletinsPage() {
  const [filiereId, setFiliereId] = useState('');
  const [niveau, setNiveau] = useState('');
  const [semestre, setSemestre] = useState(8);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());
  const [matieresIncompletes, setMatieresIncompletes] = useState<MatiereIncomplete[] | null>(null);

  const { data: filieres } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });

  const genererMutation = useMutation({
    mutationFn: () => bulletinsApi.generer({ filiereId, niveau, semestre, anneeScolaire }),
    onSuccess: () => {
      toast.success('Génération lancée - les bulletins et le PV seront disponibles sous peu');
      setMatieresIncompletes(null);
    },
    onError: (err: unknown) => {
      const error = (err as { response?: { data?: { error?: { message?: string; details?: { matieresIncompletes?: MatiereIncomplete[] } } } } })?.response?.data?.error;
      if (error?.details?.matieresIncompletes) {
        setMatieresIncompletes(error.details.matieresIncompletes);
      }
      toast.error(error?.message ?? 'Échec du lancement de la génération');
    },
  });

  return (
    <div>
      <PageHeader title="Documents officiels" description="Génération des bulletins de semestre et du procès-verbal de délibération" />

      <Card className="max-w-xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label>Filière</Label>
            <Select value={filiereId} onValueChange={setFiliereId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{filieres?.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Niveau</Label>
            <Input value={niveau} onChange={(e) => setNiveau(e.target.value)} placeholder="Ex: Ingénieur 3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEMESTRE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année scolaire</Label>
              <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{anneeScolaireOptions().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {matieresIncompletes && matieresIncompletes.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> Notes non validées</div>
              <ul className="mt-1 list-inside list-disc">
                {matieresIncompletes.map((m) => <li key={m.id}>{m.nom}</li>)}
              </ul>
            </div>
          )}

          <Button className="w-full" loading={genererMutation.isPending} disabled={!filiereId || !niveau} onClick={() => genererMutation.mutate()}>
            <Sparkles className="h-4 w-4" /> Générer bulletins et PV
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileBadge className="h-3.5 w-3.5" /> Génération asynchrone, traitée en file d&apos;attente (jusqu&apos;à 2 min pour 200 étudiants).</p>
        </CardContent>
      </Card>
    </div>
  );
}
