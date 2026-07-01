'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Upload, FileText, FileType2, Presentation, CheckCircle2, Clock, XCircle,
  MoreVertical, Pencil, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { coursApi, adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatBytes, formatDate } from '@/lib/utils';
import type { CoursDocument, Matiere, PaginatedResponse } from '@/types';

const FORMAT_ICON = { PDF: FileText, PPTX: Presentation, DOCX: FileType2 } as const;

const STATUT_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; icon: typeof CheckCircle2 }> = {
  INDEXE:     { label: 'Indexé',        variant: 'success',     icon: CheckCircle2 },
  EN_COURS:   { label: 'Indexation...', variant: 'warning',     icon: Clock },
  NON_INDEXE: { label: 'En attente',    variant: 'secondary',   icon: Clock },
  ERREUR:     { label: 'Erreur',        variant: 'destructive', icon: XCircle },
};

export default function EnseignantCoursPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // ── État dialogs ──────────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<CoursDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<CoursDocument | null>(null);

  // ── Formulaire création ───────────────────────────────────────────────────
  const [matiereId, setMatiereId] = useState('');
  const [titre, setTitre] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // ── Formulaire édition ────────────────────────────────────────────────────
  const [editTitre, setEditTitre] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['cours', 'enseignant', 'all'],
    queryFn: () => coursApi.list({ pageSize: 50 }).then((r) => r.data as PaginatedResponse<CoursDocument>),
  });

  const { data: matieres } = useQuery({
    queryKey: ['structures', 'matieres', 'mine'],
    queryFn: () => adminApi.structures.matieres.list().then((r) => r.data.data as Matiere[]),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('matiereId', matiereId);
      fd.append('titre', titre);
      fd.append('fichier', file!);
      return coursApi.upload(fd);
    },
    onSuccess: () => {
      toast.success('Document déposé, indexation IA en cours');
      qc.invalidateQueries({ queryKey: ['cours'] });
      setUploadOpen(false);
      setTitre(''); setFile(null); setMatiereId('');
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec du dépôt'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (editTitre) fd.append('titre', editTitre);
      if (editFile) fd.append('fichier', editFile);
      return coursApi.update(editDoc!.id, fd);
    },
    onSuccess: () => {
      toast.success(editFile ? 'Document remplacé, réindexation IA en cours' : 'Titre mis à jour');
      qc.invalidateQueries({ queryKey: ['cours'] });
      setEditDoc(null); setEditTitre(''); setEditFile(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la modification'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => coursApi.delete(deleteDoc!.id),
    onSuccess: () => {
      toast.success('Document supprimé');
      qc.invalidateQueries({ queryKey: ['cours'] });
      setDeleteDoc(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la suppression'),
  });

  function openEdit(doc: CoursDocument) {
    setEditDoc(doc);
    setEditTitre(doc.titre);
    setEditFile(null);
  }

  return (
    <div>
      <PageHeader
        title="Mes cours"
        description="Déposez et gérez les supports de cours de vos matières"
        action={<Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Déposer un document</Button>}
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState icon={Upload} title="Aucun document déposé" description="Commencez par déposer un support de cours pour vos étudiants." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((doc, i) => {
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
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statut.variant} className="gap-1">
                        <statut.icon className="h-3 w-3" /> {statut.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(doc)}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDoc(doc)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 font-medium leading-snug">{doc.titre}</p>
                  <p className="text-xs text-muted-foreground">{doc.matiere?.nom}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(doc.tailleOctets)}</span>
                    <span>{doc.nbTelechargements} téléchargement(s)</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(doc.dateDepot)}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ══ Dialog Dépôt ════════════════════════════════════════════════════ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déposer un support de cours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Matière</Label>
              <Select value={matiereId} onValueChange={setMatiereId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une matière" /></SelectTrigger>
                <SelectContent>
                  {matieres?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du document</Label>
              <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Chapitre 3 - Architecture logicielle" />
            </div>
            <div className="space-y-2">
              <Label>Fichier (PDF, PPTX, DOCX — 50 Mo max)</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent"
              >
                <Upload className="h-4 w-4" /> {file ? file.name : 'Choisir un fichier'}
              </button>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.pptx,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Annuler</Button>
            <Button loading={uploadMutation.isPending} disabled={!matiereId || !titre || !file} onClick={() => uploadMutation.mutate()}>
              Déposer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Dialog Modification ═════════════════════════════════════════════ */}
      <Dialog open={!!editDoc} onOpenChange={(o) => { if (!o) { setEditDoc(null); setEditFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le support de cours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre</Label>
              <Input
                id="edit-titre"
                value={editTitre}
                onChange={(e) => setEditTitre(e.target.value)}
                placeholder="Titre du document"
              />
            </div>
            <div className="space-y-2">
              <Label>Remplacer le fichier <span className="font-normal text-muted-foreground">(optionnel)</span></Label>
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-4 text-sm text-muted-foreground hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                {editFile ? editFile.name : (editDoc ? `Fichier actuel : ${editDoc.nomFichier}` : 'Choisir un fichier')}
              </button>
              <input ref={editFileInputRef} type="file" hidden accept=".pdf,.pptx,.docx"
                onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
              {editFile && (
                <p className="text-xs text-muted-foreground">
                  Le fichier actuel sera remplacé et le document sera réindexé par l&apos;IA.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDoc(null); setEditFile(null); }}>Annuler</Button>
            <Button
              loading={updateMutation.isPending}
              disabled={!editTitre || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ AlertDialog Suppression ══════════════════════════════════════════ */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => { if (!o) setDeleteDoc(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document <strong>« {deleteDoc?.titre} »</strong> sera définitivement supprimé ainsi que tous ses chunks IA. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
