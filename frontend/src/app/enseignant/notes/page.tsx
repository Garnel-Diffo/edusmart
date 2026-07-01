'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, GraduationCap, CheckCircle2, Clock, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { notesApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { currentAnneeScolaire, anneeScolaireOptions, SEMESTRE_OPTIONS } from '@/lib/academic-period';
import { getInitials } from '@/lib/utils';
import type { Matiere, EtudiantInscrit } from '@/types';

interface SessionData {
  notes: { etudiantId: string; valeur: number }[];
  estValide: boolean;
  coefficientEvaluation: number;
  commentaireRefus: string | null;
}

const TYPES_EVALUATION = [
  { value: 'CONTROLE', label: 'Contrôle' },
  { value: 'EXAMEN', label: 'Examen' },
  { value: 'TP', label: 'TP' },
  { value: 'PROJET', label: 'Projet' },
];

export default function EnseignantNotesPage() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const [matiereId, setMatiereId] = useState(searchParams.get('matiereId') ?? '');
  const [typeEvaluation, setTypeEvaluation] = useState('CONTROLE');
  const [semestre, setSemestre] = useState(1);
  const [anneeScolaire, setAnneeScolaire] = useState(currentAnneeScolaire());
  const [coefficientEvaluation, setCoefficientEvaluation] = useState(1);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  // ── Données ─────────────────────────────────────────────────────────
  const { data: matieres } = useQuery({
    queryKey: ['structures', 'matieres', 'mine'],
    queryFn: () =>
      adminApi.structures.matieres.list()
        .then((r) => (r.data.data as Matiere[]).filter((m) => m.enseignantId === user?.id)),
  });

  const { data: etudiants, isLoading: loadingEtudiants } = useQuery({
    queryKey: ['notes', 'etudiants', matiereId],
    queryFn: () => notesApi.listEtudiants(matiereId).then((r) => r.data.data as EtudiantInscrit[]),
    enabled: !!matiereId,
  });

  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['notes', 'session', matiereId, typeEvaluation, semestre, anneeScolaire],
    queryFn: () => notesApi.session(matiereId, typeEvaluation, semestre, anneeScolaire).then((r) => r.data.data as SessionData),
    enabled: !!matiereId,
  });

  // Sync session data into form; reset when no session found
  useEffect(() => {
    if (!sessionData) return;
    if (sessionData.notes.length > 0) {
      setCoefficientEvaluation(sessionData.coefficientEvaluation);
      const map: Record<string, string> = {};
      for (const n of sessionData.notes) map[n.etudiantId] = String(n.valeur);
      setValeurs(map);
    } else {
      setValeurs({});
    }
  }, [sessionData]);

  // ── Mutation saisie / modification ──────────────────────────────────
  const saisirMutation = useMutation({
    mutationFn: () => {
      const notes = Object.entries(valeurs)
        .filter(([, v]) => v !== '')
        .map(([etudiantId, v]) => ({ etudiantId, valeur: Number(v) }));
      return notesApi.saisir({ matiereId, typeEvaluation, semestre, anneeScolaire, coefficientEvaluation, notes });
    },
    onSuccess: () => {
      toast.success(sessionData && sessionData.notes.length > 0
        ? 'Notes mises à jour et renvoyées pour validation'
        : 'Notes enregistrées et envoyées pour validation');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Échec de l'enregistrement";
      toast.error(message);
    },
  });

  function setNote(etudiantId: string, value: string) {
    if (value !== '' && (Number(value) < 0 || Number(value) > 20)) return;
    setValeurs((prev) => ({ ...prev, [etudiantId]: value }));
  }

  const estValide = sessionData?.estValide ?? false;
  const estRefusee = !estValide && !!sessionData?.commentaireRefus;
  const enAttente = !estValide && !estRefusee && (sessionData?.notes?.length ?? 0) > 0;
  const hasNotes = !loadingSession && Object.values(valeurs).some((v) => v !== '');

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Saisissez et suivez les notes de vos étudiants"
      />

      {/* ── Filtres ─────────────────────────────────────────────── */}
      <Card className="mb-4">
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Coeff. éval.</span>
            <Input
              type="number"
              min={0.1}
              max={10}
              step={0.5}
              value={coefficientEvaluation}
              onChange={(e) => setCoefficientEvaluation(Number(e.target.value))}
              disabled={estValide}
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Pas de matière sélectionnée ─────────────────────────── */}
      {!matiereId && (
        <EmptyState icon={GraduationCap} title="Sélectionnez une matière" description="Choisissez une matière pour afficher la grille de saisie." />
      )}

      {/* ── Statut de la session ─────────────────────────────────── */}
      {matiereId && !loadingSession && sessionData && sessionData.notes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          {estValide && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Notes <strong>validées</strong> par l&apos;administration - elles ne peuvent plus être modifiées.</span>
              <Badge variant="outline" className="ml-auto border-emerald-500/40 text-emerald-600">Validé</Badge>
            </div>
          )}
          {estRefusee && (
            <div className="flex flex-col gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Correction requise par l&apos;administration
                <Badge variant="destructive" className="ml-auto">Refusé</Badge>
              </div>
              <p className="pl-6 text-xs opacity-80">{sessionData.commentaireRefus}</p>
            </div>
          )}
          {enAttente && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Notes enregistrées - <strong>en attente de validation</strong>. Vous pouvez encore les modifier.</span>
              <Pencil className="ml-auto h-3.5 w-3.5 opacity-60" />
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tableau des étudiants ────────────────────────────────── */}
      {matiereId && !loadingEtudiants && etudiants && etudiants.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Étudiant</th>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3 text-right">Note / 20</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {etudiants.map((e) => (
                  <tr key={e.utilisateurId} className={cn(estValide && 'opacity-60')}>
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
                        disabled={estValide}
                        className={cn(
                          'ml-auto w-24 text-right',
                          estValide && 'cursor-not-allowed bg-muted',
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!estValide && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {enAttente ? 'Modifiez les notes puis cliquez sur Enregistrer pour les remettre en attente.' : 'Les notes seront envoyées pour validation à l\'administration.'}
              </p>
              <Button
                loading={saisirMutation.isPending}
                onClick={() => saisirMutation.mutate()}
                disabled={!hasNotes}
              >
                <Save className="h-4 w-4" />
                {enAttente || estRefusee ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {matiereId && !loadingEtudiants && etudiants?.length === 0 && (
        <EmptyState icon={GraduationCap} title="Aucun étudiant inscrit" description="Aucun étudiant n'est inscrit dans la filière de cette matière." />
      )}
    </div>
  );
}
