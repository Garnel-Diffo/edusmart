'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Search, Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AnnonceCard } from '@/components/annonces/annonce-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { annoncesApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { Annonce, PaginatedResponse } from '@/types';

const CIBLE_OPTIONS = [
  { value: 'TOUTES', label: 'Toutes les cibles' },
  { value: 'TOUS', label: 'Toute la plateforme' },
  { value: 'FILIERE', label: 'Filière' },
  { value: 'MODULE', label: 'Module' },
  { value: 'ETUDIANT', label: 'Personnel' },
];

const PERIODE_OPTIONS = [
  { value: 'TOUTE', label: 'Toute période' },
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
];

const PAGE_SIZE = 12;

export default function EtudiantAnnoncesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [recherche, setRecherche] = useState('');
  const [cibleFiltre, setCibleFiltre] = useState('TOUTES');
  const [periodeFiltre, setPeriodeFiltre] = useState('TOUTE');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['annonces', 'list'],
    queryFn: () => annoncesApi.list({ pageSize: 100 }).then((r) => r.data as PaginatedResponse<Annonce>),
  });

  const publierMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('contenu', contenu);
      formData.append('cible', 'FILIERE');
      if (fichier) formData.append('fichier', fichier);
      return annoncesApi.publier(formData);
    },
    onSuccess: () => {
      toast.success('Annonce publiée à votre filière');
      setTitre(''); setContenu(''); setFichier(null); setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['annonces'] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la publication';
      toast.error(message);
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const seuilJours = periodeFiltre === 'TOUTE' ? null : Number(periodeFiltre);
    const maintenant = Date.now();

    return data.data.filter((a) => {
      const matchCible = cibleFiltre === 'TOUTES' || a.cible === cibleFiltre;
      const matchRecherche =
        !recherche.trim() ||
        a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
        a.contenu.toLowerCase().includes(recherche.toLowerCase());
      const matchPeriode =
        seuilJours === null || maintenant - new Date(a.datePublication).getTime() <= seuilJours * 86_400_000;
      return matchCible && matchRecherche && matchPeriode;
    });
  }, [data, cibleFiltre, recherche, periodeFiltre]);

  const visibles = filtered.slice(0, visibleCount);

  return (
    <div>
      <PageHeader
        title="Annonces"
        description="Communications de vos enseignants et de l'administration"
        action={
          user?.etudiant?.estDelegue ? (
            <Button onClick={() => setDialogOpen(true)}><Send className="h-4 w-4" /> Publier à ma filière</Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="Rechercher dans les annonces..."
            className="pl-9"
          />
        </div>
        <Select value={cibleFiltre} onValueChange={(v) => { setCibleFiltre(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{CIBLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={periodeFiltre} onValueChange={(v) => { setPeriodeFiltre(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={Megaphone} title="Aucune annonce trouvée" description="Essayez d'élargir vos filtres ou votre recherche." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((a, i) => (
          <AnnonceCard key={a.id} annonce={a} href={`/etudiant/annonces/${a.id}`} index={i} compact />
        ))}
      </div>

      {visibleCount < filtered.length && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Charger plus ({filtered.length - visibleCount} restantes)
          </Button>
        </div>
      )}

      {user?.etudiant?.estDelegue && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Publier une annonce à votre filière</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Rappel - Réunion de classe demain" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contenu">Message (légende)</Label>
                <Textarea id="contenu" value={contenu} onChange={(e) => setContenu(e.target.value)} rows={5} placeholder="Votre message à vos camarades..." />
              </div>
              <div className="space-y-2">
                <Label>Pièce jointe (optionnel)</Label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground hover:bg-accent"
                >
                  <Paperclip className="h-4 w-4" /> {fichier ? fichier.name : 'Joindre une image, un document...'}
                </button>
                <input ref={fileInputRef} type="file" hidden onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button loading={publierMutation.isPending} disabled={!titre || !contenu} onClick={() => publierMutation.mutate()}>
                <Send className="h-4 w-4" /> Publier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
