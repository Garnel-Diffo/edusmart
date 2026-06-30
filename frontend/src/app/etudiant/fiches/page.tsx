'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Download, ListChecks, BookOpenCheck, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { iaApi, adminApi, documentsPersonnelsApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Module, Matiere, FicheRevision, DocumentPersonnel } from '@/types';

const MARQUEUR_HORS_COURS = 'Contenu généré à partir des connaissances générales';

const TYPES = [
  { value: 'FICHE_RESUME', label: 'Fiche résumée', icon: FileText },
  { value: 'RESUME_DETAILLE', label: 'Résumé détaillé', icon: BookOpenCheck },
  { value: 'QUIZ_QCM', label: 'Quiz QCM', icon: ListChecks },
] as const;

export default function FichesPage() {
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('FICHE_RESUME');
  const [moduleId, setModuleId] = useState<string>('');
  const [matiereId, setMatiereId] = useState<string>('');
  const [documentPersonnelId, setDocumentPersonnelId] = useState<string>('');
  const [fiche, setFiche] = useState<FicheRevision | null>(null);
  const [polling, setPolling] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ['structures', 'modules'],
    queryFn: () => adminApi.structures.modules.list().then((r) => r.data.data as Module[]),
  });

  const { data: matieres } = useQuery({
    queryKey: ['structures', 'matieres', moduleId],
    queryFn: () => adminApi.structures.matieres.list(moduleId).then((r) => r.data.data as Matiere[]),
    enabled: !!moduleId,
  });

  const { data: documentsPersonnels } = useQuery({
    queryKey: ['documents-personnels'],
    queryFn: () => documentsPersonnelsApi.list().then((r) => r.data.data as DocumentPersonnel[]),
  });
  const documentsPersonnelsIndexes = documentsPersonnels?.filter((d) => d.statutIndexation === 'INDEXE') ?? [];

  const genererMutation = useMutation({
    mutationFn: () =>
      iaApi
        .genererFiche({
          type,
          moduleId: documentPersonnelId ? undefined : moduleId || undefined,
          matiereId: documentPersonnelId ? undefined : matiereId || undefined,
          documentPersonnelId: documentPersonnelId || undefined,
        })
        .then((r) => r.data.data as FicheRevision),
    onSuccess: (created) => {
      setFiche(created);
      setPolling(true);
      toast.info('Génération en cours, cela peut prendre jusqu\'à 20 secondes...');
    },
    onError: () => toast.error('Impossible de démarrer la génération'),
  });

  const pollFiche = useCallback(async () => {
    if (!fiche) return;
    const { data } = await iaApi.getFiche(fiche.id);
    const updated = data.data as FicheRevision;
    setFiche(updated);
    if (updated.statut !== 'EN_COURS') setPolling(false);
  }, [fiche]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollFiche, 2500);
    return () => clearInterval(interval);
  }, [polling, pollFiche]);

  async function exporterPdf() {
    if (!fiche) return;
    try {
      const { data } = await iaApi.exporterFichePdf(fiche.id);
      window.open((data.data as { url: string }).url, '_blank');
    } catch {
      toast.error("Échec de l'export PDF");
    }
  }

  return (
    <div>
      <PageHeader title="Génération de fiches" description="Fiches de révision, résumés ou quiz générés par IA à partir de vos cours" />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm font-medium">Type de contenu</p>
              <div className="grid grid-cols-1 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${type === t.value ? 'border-primary bg-primary/5 font-medium text-primary' : 'hover:bg-accent'}`}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Module</p>
              <Select
                value={moduleId}
                onValueChange={(v) => { setModuleId(v); setMatiereId(''); setDocumentPersonnelId(''); }}
                disabled={!!documentPersonnelId}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                <SelectContent>
                  {modules?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Matière (optionnel)</p>
              <Select value={matiereId} onValueChange={setMatiereId} disabled={!moduleId || !!documentPersonnelId}>
                <SelectTrigger><SelectValue placeholder="Toutes les matières du module" /></SelectTrigger>
                <SelectContent>
                  {matieres?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Ou : mon document personnel</p>
              <Select
                value={documentPersonnelId}
                onValueChange={(v) => { setDocumentPersonnelId(v); setModuleId(''); setMatiereId(''); }}
                disabled={documentsPersonnelsIndexes.length === 0}
              >
                <SelectTrigger><SelectValue placeholder={documentsPersonnelsIndexes.length === 0 ? 'Aucun document indexé' : 'Sélectionner un document'} /></SelectTrigger>
                <SelectContent>
                  {documentsPersonnelsIndexes.map((d) => <SelectItem key={d.id} value={d.id}>{d.titre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              loading={genererMutation.isPending || polling}
              disabled={!moduleId && !documentPersonnelId}
              onClick={() => genererMutation.mutate()}
            >
              <Sparkles className="h-4 w-4" /> Générer
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardContent className="p-5">
            {!fiche && (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 opacity-30" />
                <p className="text-sm">Configurez puis générez votre contenu de révision</p>
              </div>
            )}
            {fiche?.statut === 'EN_COURS' && (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Génération en cours par l&apos;IA...</p>
              </div>
            )}
            {fiche?.statut === 'ECHEC' && (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center">
                <Badge variant="destructive">Échec</Badge>
                <p className="text-sm text-muted-foreground">Contenu insuffisant ou erreur de génération. Essayez un autre périmètre.</p>
              </div>
            )}
            {fiche?.statut === 'PRET' && fiche.contenuGenere && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Prêt</Badge>
                    {fiche.contenuGenere.includes(MARQUEUR_HORS_COURS) && (
                      <Badge variant="secondary" className="gap-1"><Brain className="h-3 w-3" /> Connaissances générales de l&apos;IA</Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={exporterPdf}><Download className="h-4 w-4" /> Export PDF</Button>
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">{fiche.contenuGenere}</div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
