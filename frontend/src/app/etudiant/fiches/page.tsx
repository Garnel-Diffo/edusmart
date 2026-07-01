'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Sparkles, Download, ListChecks, BookOpenCheck, Brain,
  Clock, ChevronDown, ChevronUp, History,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { iaApi, adminApi, documentsPersonnelsApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { Module, Matiere, FicheRevision, DocumentPersonnel, PaginatedResponse } from '@/types';

const MARQUEUR_HORS_COURS = 'Contenu généré à partir des connaissances générales';

const TYPES = [
  { value: 'FICHE_RESUME', label: 'Fiche résumée', icon: FileText },
  { value: 'RESUME_DETAILLE', label: 'Résumé détaillé', icon: BookOpenCheck },
  { value: 'QUIZ_QCM', label: 'Quiz QCM', icon: ListChecks },
] as const;

const TYPE_LABEL: Record<string, string> = {
  FICHE_RESUME: 'Fiche résumée',
  RESUME_DETAILLE: 'Résumé détaillé',
  QUIZ_QCM: 'Quiz QCM',
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>,
        h4: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>,
        p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-primary/30 pl-4 text-muted-foreground italic">{children}</blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          return isBlock ? (
            <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{children}</code>
          );
        },
        hr: () => <hr className="my-4 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function FicheCard({ fiche, onExpand }: { fiche: FicheRevision & { matiere?: { nom: string } | null; module?: { nom: string } | null }; onExpand: (f: typeof fiche) => void }) {
  const typeLabel = TYPE_LABEL[fiche.type] ?? fiche.type;
  const scope = fiche.matiere?.nom ?? fiche.module?.nom ?? 'Document personnel';

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            {fiche.statut === 'PRET' && <Badge variant="success" className="text-xs">Prêt</Badge>}
            {fiche.statut === 'EN_COURS' && <Badge variant="warning" className="text-xs">En cours</Badge>}
            {fiche.statut === 'ECHEC' && <Badge variant="destructive" className="text-xs">Échec</Badge>}
          </div>
          <p className="truncate text-sm font-medium">{scope}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {formatDate(fiche.createdAt)}
          </p>
        </div>
        {fiche.statut === 'PRET' && fiche.contenuGenere && (
          <Button variant="ghost" size="sm" onClick={() => onExpand(fiche)}>
            Voir
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function FichesPage() {
  const qc = useQueryClient();
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('FICHE_RESUME');
  const [moduleId, setModuleId] = useState<string>('');
  const [matiereId, setMatiereId] = useState<string>('');
  const [documentPersonnelId, setDocumentPersonnelId] = useState<string>('');
  const [fiche, setFiche] = useState<FicheRevision | null>(null);
  const [polling, setPolling] = useState(false);
  const [ficheExpandue, setFicheExpandue] = useState<(FicheRevision & { matiere?: { nom: string } | null; module?: { nom: string } | null }) | null>(null);
  const [showHistorique, setShowHistorique] = useState(false);

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

  const { data: historique, isLoading: loadingHistorique } = useQuery({
    queryKey: ['ia', 'fiches'],
    queryFn: () => iaApi.listFiches({ pageSize: 30 }).then((r) => r.data as PaginatedResponse<FicheRevision & { matiere?: { nom: string } | null; module?: { nom: string } | null }>),
  });

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
      qc.invalidateQueries({ queryKey: ['ia', 'fiches'] });
      toast.info('Génération en cours, cela peut prendre jusqu\'à 20 secondes...');
    },
    onError: () => toast.error('Impossible de démarrer la génération'),
  });

  const pollFiche = useCallback(async () => {
    if (!fiche) return;
    const { data } = await iaApi.getFiche(fiche.id);
    const updated = data.data as FicheRevision;
    setFiche(updated);
    if (updated.statut !== 'EN_COURS') {
      setPolling(false);
      if (updated.statut === 'PRET') qc.invalidateQueries({ queryKey: ['ia', 'fiches'] });
    }
  }, [fiche, qc]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollFiche, 2500);
    return () => clearInterval(interval);
  }, [polling, pollFiche]);

  async function exporterPdf(f: FicheRevision) {
    try {
      const { data } = await iaApi.exporterFichePdf(f.id);
      window.open((data.data as { url: string }).url, '_blank');
    } catch {
      toast.error("Échec de l'export PDF");
    }
  }

  const ficheAffichee = fiche ?? ficheExpandue;

  return (
    <div>
      <PageHeader title="Révision IA" description="Fiches de révision, résumés et quiz générés par l'IA à partir de vos cours" />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ── Panneau de configuration ───────────────────────────────────── */}
        <div className="space-y-4">
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

          {/* Historique compact */}
          <div>
            <button
              onClick={() => setShowHistorique((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              <span className="flex items-center gap-2"><History className="h-4 w-4" /> Mes fiches ({historique?.total ?? 0})</span>
              {showHistorique ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence>
              {showHistorique && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {loadingHistorique && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  {historique?.data.map((f) => (
                    <FicheCard
                      key={f.id}
                      fiche={f}
                      onExpand={(opened) => { setFicheExpandue(opened); setFiche(null); }}
                    />
                  ))}
                  {historique?.data.length === 0 && (
                    <p className="py-3 text-center text-sm text-muted-foreground">Aucune fiche générée pour l&apos;instant</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Zone d'affichage du contenu ───────────────────────────────── */}
        <Card className="min-h-[400px]">
          <CardContent className="p-5">
            {!ficheAffichee && (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 opacity-30" />
                <p className="text-sm">Configurez puis générez votre contenu de révision,<br />ou consultez une fiche depuis l&apos;historique</p>
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

            {ficheAffichee && (ficheAffichee.statut === 'PRET' || ficheAffichee === ficheExpandue) && ficheAffichee.contenuGenere && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Prêt</Badge>
                    {ficheAffichee.contenuGenere.includes(MARQUEUR_HORS_COURS) && (
                      <Badge variant="secondary" className="gap-1"><Brain className="h-3 w-3" /> Connaissances générales de l&apos;IA</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{TYPE_LABEL[ficheAffichee.type]}</span>
                  </div>
                  <div className="flex gap-2">
                    {ficheExpandue && (
                      <Button variant="ghost" size="sm" onClick={() => setFicheExpandue(null)}>Fermer</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => exporterPdf(ficheAffichee)}>
                      <Download className="h-4 w-4" /> Export PDF
                    </Button>
                  </div>
                </div>
                <div className="text-sm leading-relaxed">
                  <MarkdownContent content={ficheAffichee.contenuGenere} />
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
