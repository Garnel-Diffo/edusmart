'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { notesApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { SessionEnAttente } from '@/types';

export default function AdminNotesValidationPage() {
  const qc = useQueryClient();
  const [refusSession, setRefusSession] = useState<SessionEnAttente | null>(null);
  const [commentaire, setCommentaire] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'sessions-en-attente'],
    queryFn: () => notesApi.sessionsEnAttente().then((r) => r.data.data as SessionEnAttente[]),
  });

  const validerMutation = useMutation({
    mutationFn: (s: SessionEnAttente) => notesApi.valider({ matiereId: s.matiereId, semestre: s.semestre, anneeScolaire: s.anneeScolaire }),
    onSuccess: () => { toast.success('Notes validées et publiées aux étudiants'); qc.invalidateQueries({ queryKey: ['notes', 'sessions-en-attente'] }); },
    onError: () => toast.error('Échec de la validation'),
  });

  const refuserMutation = useMutation({
    mutationFn: () => notesApi.refuser({ matiereId: refusSession!.matiereId, semestre: refusSession!.semestre, anneeScolaire: refusSession!.anneeScolaire, commentaire }),
    onSuccess: () => {
      toast.success("L'enseignant a été notifié pour correction");
      qc.invalidateQueries({ queryKey: ['notes', 'sessions-en-attente'] });
      setRefusSession(null);
      setCommentaire('');
    },
    onError: () => toast.error('Échec du refus'),
  });

  return (
    <div>
      <PageHeader title="Validation des notes" description="Sessions de notes saisies par les enseignants, en attente de validation" />

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {!isLoading && data?.length === 0 && <EmptyState icon={ClipboardCheck} title="Aucune note en attente" description="Toutes les notes saisies ont été traitées." />}

      <div className="space-y-3">
        {data?.map((s, i) => (
          <motion.div key={`${s.matiereId}-${s.semestre}-${s.anneeScolaire}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{s.matiere?.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.matiere?.module.filiere.nom} · {s.matiere?.module.nom} · Semestre {s.semestre} ({s.anneeScolaire})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="warning">{s.nbNotesEnAttente} note(s)</Badge>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRefusSession(s)}>
                    <XCircle className="h-4 w-4" /> Refuser
                  </Button>
                  <Button size="sm" loading={validerMutation.isPending && validerMutation.variables?.matiereId === s.matiereId} onClick={() => validerMutation.mutate(s)}>
                    <CheckCircle2 className="h-4 w-4" /> Valider
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!refusSession} onOpenChange={(o) => !o && setRefusSession(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Refuser la validation</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Commentaire pour l&apos;enseignant</Label>
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={4} placeholder="Expliquez la raison du refus..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefusSession(null)}>Annuler</Button>
            <Button variant="destructive" loading={refuserMutation.isPending} disabled={commentaire.length < 5} onClick={() => refuserMutation.mutate()}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
