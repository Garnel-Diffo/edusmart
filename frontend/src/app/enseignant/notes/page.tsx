'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { notesApi, adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_OPTIONS } from '@/lib/academic-period';
import { getInitials } from '@/lib/utils';
import type { Matiere, EtudiantInscrit } from '@/types';

const TYPES_EVALUATION = [
  { value: 'CONTROLE', label: 'Contrôle' },
  { value: 'EXAMEN', label: 'Examen' },
  { value: 'TP', label: 'TP' },
  { value: 'PROJET', label: 'Projet' },
];

export default function EnseignantNotesPage() {
  const [matiereId, setMatiereId] = useState('');
  const [typeEvaluation, setTypeEvaluation] = useState('CONTROLE');
  const [semestre, setSemestre] = useState(8);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());
  const [coefficientEvaluation, setCoefficientEvaluation] = useState(1);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  const { data: matieres } = useQuery({
    queryKey: ['structures', 'matieres', 'mine'],
    queryFn: () => adminApi.structures.matieres.list().then((r) => r.data.data as Matiere[]),
  });

  const { data: etudiants, isLoading } = useQuery({
    queryKey: ['notes', 'etudiants', matiereId],
    queryFn: () => notesApi.listEtudiants(matiereId).then((r) => r.data.data as EtudiantInscrit[]),
    enabled: !!matiereId,
  });

  useEffect(() => setValeurs({}), [matiereId, typeEvaluation, semestre, anneeScolaire]);

  const saisirMutation = useMutation({
    mutationFn: () => {
      const notes = Object.entries(valeurs)
        .filter(([, v]) => v !== '')
        .map(([etudiantId, v]) => ({ etudiantId, valeur: Number(v) }));
      return notesApi.saisir({ matiereId, typeEvaluation, semestre, anneeScolaire, coefficientEvaluation, notes });
    },
    onSuccess: () => toast.success('Notes enregistrées et envoyées pour validation'),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Échec de l'enregistrement";
      toast.error(message);
    },
  });

  function setNote(etudiantId: string, value: string) {
    if (value !== '' && (Number(value) < 0 || Number(value) > 20)) return; // UC9 - 4a
    setValeurs((prev) => ({ ...prev, [etudiantId]: value }));
  }

  return (
    <div>
      <PageHeader title="Saisie des notes" description="Saisissez les notes de vos étudiants pour validation par l'administration" />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Select value={matiereId} onValueChange={setMatiereId}>
            <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
            <SelectContent>{matieres?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={typeEvaluation} onValueChange={setTypeEvaluation}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES_EVALUATION.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(semestre)} onValueChange={(v) => setSemestre(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SEMESTRE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{anneeScolaireOptions().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
            <span className="text-sm text-muted-foreground">Coeff. évaluation</span>
            <Input type="number" min={0.1} max={10} step={0.5} value={coefficientEvaluation} onChange={(e) => setCoefficientEvaluation(Number(e.target.value))} className="w-20" />
          </div>
        </CardContent>
      </Card>

      {!matiereId && <EmptyState icon={GraduationCap} title="Sélectionnez une matière" description="Choisissez une matière pour afficher la grille de saisie." />}

      {matiereId && !isLoading && etudiants && etudiants.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Étudiant</th><th className="px-4 py-3">Matricule</th><th className="px-4 py-3 text-right">Note / 20</th></tr>
              </thead>
              <tbody className="divide-y">
                {etudiants.map((e) => (
                  <tr key={e.utilisateurId}>
                    <td className="flex items-center gap-2 px-4 py-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(e.utilisateur.nom, e.utilisateur.prenom)}
                      </span>
                      {e.utilisateur.prenom} {e.utilisateur.nom}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.matricule}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        value={valeurs[e.utilisateurId] ?? ''}
                        onChange={(ev) => setNote(e.utilisateurId, ev.target.value)}
                        className="ml-auto w-24 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button loading={saisirMutation.isPending} onClick={() => saisirMutation.mutate()} disabled={Object.values(valeurs).every((v) => v === '')}>
              <Save className="h-4 w-4" /> Enregistrer les notes
            </Button>
          </div>
        </motion.div>
      )}

      {matiereId && !isLoading && etudiants?.length === 0 && (
        <EmptyState icon={GraduationCap} title="Aucun étudiant inscrit" description="Aucun étudiant n'est inscrit dans la filière de cette matière." />
      )}
    </div>
  );
}
