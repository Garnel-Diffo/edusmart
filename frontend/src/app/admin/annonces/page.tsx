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
import type { Annonce, Filiere, Module, PaginatedResponse } from '@/types';

const CIBLES = [
  { value: 'TOUS', label: 'Toute la plateforme' },
  { value: 'FILIERE', label: 'Une filière' },
  { value: 'MODULE', label: 'Un module' },
];

export default function AdminAnnoncesPage() {
  const qc = useQueryClient();
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [cible, setCible] = useState('TOUS');
  const [filiereId, setFiliereId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({ queryKey: ['annonces', 'list'], queryFn: () => annoncesApi.list({ pageSize: 100 }).then((r) => r.data as PaginatedResponse<Annonce>) });
  const { data: filieres } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });
  const { data: modules } = useQuery({ queryKey: ['structures', 'modules', 'all'], queryFn: () => adminApi.structures.modules.list().then((r) => r.data.data as Module[]) });

  const publierMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('contenu', contenu);
      formData.append('cible', cible);
      if (cible === 'FILIERE') formData.append('filiereId', filiereId);
      if (cible === 'MODULE') formData.append('moduleId', moduleId);
      if (fichier) formData.append('fichier', fichier);
      return annoncesApi.publier(formData);
    },
    onSuccess: () => {
      toast.success('Annonce publiée');
      setTitre(''); setContenu(''); setCible('TOUS'); setFiliereId(''); setModuleId(''); setFichier(null);
      qc.invalidateQueries({ queryKey: ['annonces'] });
    },
    onError: () => toast.error('Échec de la publication'),
  });

  return (
    <div>
      <PageHeader title="Annonces" description="Publiez une annonce à destination de tout ou partie de l'établissement" />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Cible</Label>
              <Select value={cible} onValueChange={setCible}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CIBLES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {cible === 'FILIERE' && (
              <div className="space-y-2">
                <Label>Filière</Label>
                <Select value={filiereId} onValueChange={setFiliereId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{filieres?.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {cible === 'MODULE' && (
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{modules?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="titre">Titre</Label><Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="contenu">Contenu</Label><Textarea id="contenu" value={contenu} onChange={(e) => setContenu(e.target.value)} rows={6} /></div>
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
            <Button
              className="w-full"
              loading={publierMutation.isPending}
              disabled={!titre || !contenu || (cible === 'FILIERE' && !filiereId) || (cible === 'MODULE' && !moduleId)}
              onClick={() => publierMutation.mutate()}
            >
              <Send className="h-4 w-4" /> Publier
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {data?.data.length === 0 && <EmptyState icon={Megaphone} title="Aucune annonce publiée" className="sm:col-span-2" />}
          {data?.data.map((a, i) => (
            <AnnonceCard key={a.id} annonce={a} href={`/admin/annonces/${a.id}`} index={i} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
