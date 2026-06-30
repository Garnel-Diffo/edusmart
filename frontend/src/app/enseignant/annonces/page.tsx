'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { annoncesApi, adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AnnonceCard } from '@/components/annonces/annonce-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Annonce, Module, PaginatedResponse } from '@/types';

export default function EnseignantAnnoncesPage() {
  const qc = useQueryClient();
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['annonces', 'list'],
    queryFn: () => annoncesApi.list({ pageSize: 100 }).then((r) => r.data as PaginatedResponse<Annonce>),
  });

  const { data: modules } = useQuery({
    queryKey: ['structures', 'modules', 'mine'],
    queryFn: () => adminApi.structures.modules.list().then((r) => r.data.data as Module[]),
  });

  const publierMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('contenu', contenu);
      formData.append('cible', 'MODULE');
      formData.append('moduleId', moduleId);
      if (fichier) formData.append('fichier', fichier);
      return annoncesApi.publier(formData);
    },
    onSuccess: () => {
      toast.success('Annonce publiée');
      setTitre(''); setContenu(''); setModuleId(''); setFichier(null);
      qc.invalidateQueries({ queryKey: ['annonces'] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la publication';
      toast.error(message);
    },
  });

  return (
    <div>
      <PageHeader title="Annonces" description="Publiez une annonce pour les étudiants de vos modules" />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Module concerné</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                <SelectContent>{modules?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Report du TP de la semaine prochaine" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contenu">Contenu</Label>
              <Textarea id="contenu" value={contenu} onChange={(e) => setContenu(e.target.value)} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Pièce jointe (optionnel)</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground hover:bg-accent"
              >
                <Paperclip className="h-4 w-4" /> {fichier ? fichier.name : 'Joindre un fichier'}
              </button>
              <input ref={fileInputRef} type="file" hidden onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
            </div>
            <Button className="w-full" loading={publierMutation.isPending} disabled={!titre || !contenu || !moduleId} onClick={() => publierMutation.mutate()}>
              <Send className="h-4 w-4" /> Publier
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {data?.data.length === 0 && <EmptyState icon={Megaphone} title="Aucune annonce publiée" className="sm:col-span-2" />}
          {data?.data.map((a, i) => (
            <AnnonceCard key={a.id} annonce={a} href={`/enseignant/annonces/${a.id}`} index={i} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
