'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, FileText, FileType2, Presentation, ImageIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { documentsPersonnelsApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatBytes, formatDate } from '@/lib/utils';
import type { DocumentPersonnel } from '@/types';

const FORMAT_ICON = { PDF: FileText, PPTX: Presentation, DOCX: FileType2, IMAGE: ImageIcon } as const;

const STATUT_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; icon: typeof CheckCircle2 }> = {
  INDEXE: { label: 'Indexé', variant: 'success', icon: CheckCircle2 },
  EN_COURS: { label: 'Indexation...', variant: 'warning', icon: Clock },
  NON_INDEXE: { label: 'En attente', variant: 'secondary', icon: Clock },
  ERREUR: { label: 'Erreur', variant: 'destructive', icon: XCircle },
};

export default function DocumentsPersonnelsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['documents-personnels'],
    queryFn: () => documentsPersonnelsApi.list().then((r) => r.data.data as DocumentPersonnel[]),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('fichier', file!);
      return documentsPersonnelsApi.upload(formData);
    },
    onSuccess: () => {
      toast.success('Document déposé, indexation IA en cours');
      qc.invalidateQueries({ queryKey: ['documents-personnels'] });
      setDialogOpen(false);
      setTitre('');
      setFile(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec du dépôt';
      toast.error(message);
    },
  });

  return (
    <div>
      <PageHeader
        title="Mes documents personnels"
        description="Vos propres supports de révision (cours photographiés, notes, résumés...), utilisables pour générer vos fiches et quiz"
        action={<Button onClick={() => setDialogOpen(true)}><Upload className="h-4 w-4" /> Déposer un document</Button>}
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <EmptyState icon={Upload} title="Aucun document personnel" description="Déposez un support (PDF, Word, PowerPoint ou une photo de vos notes) pour l'utiliser dans vos fiches de révision." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((doc, i) => {
          const Icon = FORMAT_ICON[doc.format];
          const statut = STATUT_BADGE[doc.statutIndexation];
          return (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={statut.variant} className="gap-1"><statut.icon className="h-3 w-3" /> {statut.label}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 font-medium leading-snug">{doc.titre}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(doc.tailleOctets)}</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déposer un support personnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du document</Label>
              <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Mes notes - Chapitre 3" />
            </div>
            <div className="space-y-2">
              <Label>Fichier (PDF, PPTX, DOCX, JPEG, PNG - 50 Mo max)</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent"
              >
                <Upload className="h-4 w-4" /> {file ? file.name : 'Choisir un fichier'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">Une image (photo de notes manuscrites par exemple) est automatiquement transcrite par l&apos;IA.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button loading={uploadMutation.isPending} disabled={!titre || !file} onClick={() => uploadMutation.mutate()}>
              Déposer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
