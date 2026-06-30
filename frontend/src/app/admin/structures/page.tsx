'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Filiere, Module, Matiere } from '@/types';

function FilieresTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', code: '', niveau: '', cycle: '', salleAttitreeId: '' });

  const { data } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });
  const { data: salles } = useQuery({ queryKey: ['structures', 'salles'], queryFn: () => adminApi.structures.salles.list().then((r) => r.data.data as { id: string; nom: string }[]) });
  const mutation = useMutation({
    mutationFn: () => adminApi.structures.filieres.create({ ...form, salleAttitreeId: form.salleAttitreeId || undefined }),
    onSuccess: () => { toast.success('Filière créée'); qc.invalidateQueries({ queryKey: ['structures', 'filieres'] }); setOpen(false); setForm({ nom: '', code: '', niveau: '', cycle: '', salleAttitreeId: '' }); },
    onError: () => toast.error('Échec de la création'),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle filière</Button></div>
      {data?.length === 0 && <EmptyState icon={Building2} title="Aucune filière" />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-4">
              <p className="font-medium">{f.nom}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{f.code}</Badge>
                <span className="text-xs text-muted-foreground">Niveau {f.niveau} · {f.cycle}</span>
              </div>
              {f.salleAttitree && <p className="mt-1 text-xs text-muted-foreground">Salle attitrée : {f.salleAttitree.nom}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle filière</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: AIA-4" /></div>
              <div className="space-y-2"><Label>Niveau</Label><Input value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} placeholder="Ex: 4" /></div>
            </div>
            <div className="space-y-2"><Label>Cycle</Label><Input value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} placeholder="Ex: Ingénieur, Licence..." /></div>
            <div className="space-y-2">
              <Label>Salle attitrée (optionnel)</Label>
              <Select value={form.salleAttitreeId} onValueChange={(v) => setForm({ ...form, salleAttitreeId: v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>{salles?.map((s) => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button loading={mutation.isPending} disabled={!form.nom || !form.code || !form.niveau || !form.cycle} onClick={() => mutation.mutate()}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModulesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ filiereId: '', nom: '', code: '', semestre: 1, creditsEcts: 6 });

  const { data: filieres } = useQuery({ queryKey: ['structures', 'filieres'], queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]) });
  const { data } = useQuery({ queryKey: ['structures', 'modules', 'all'], queryFn: () => adminApi.structures.modules.list().then((r) => r.data.data as Module[]) });
  const mutation = useMutation({
    mutationFn: () => adminApi.structures.modules.create(form),
    onSuccess: () => { toast.success('Module créé'); qc.invalidateQueries({ queryKey: ['structures', 'modules'] }); setOpen(false); },
    onError: () => toast.error('Échec de la création'),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau module</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((m) => (
          <Card key={m.id}><CardContent className="p-4"><p className="font-medium">{m.nom}</p><p className="text-xs text-muted-foreground">{m.filiere?.nom} · S{m.semestre} · {m.creditsEcts} ECTS</p></CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau module</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Filière</Label>
              <Select value={form.filiereId} onValueChange={(v) => setForm({ ...form, filiereId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{filieres?.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Semestre</Label><Input type="number" min={1} max={12} value={form.semestre} onChange={(e) => setForm({ ...form, semestre: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Crédits ECTS</Label><Input type="number" min={1} value={form.creditsEcts} onChange={(e) => setForm({ ...form, creditsEcts: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button loading={mutation.isPending} disabled={!form.filiereId} onClick={() => mutation.mutate()}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatieresTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ moduleId: '', nom: '', code: '', coefficient: 1, creditsEcts: 3 });

  const { data: modules } = useQuery({ queryKey: ['structures', 'modules', 'all'], queryFn: () => adminApi.structures.modules.list().then((r) => r.data.data as Module[]) });
  const { data } = useQuery({ queryKey: ['structures', 'matieres', 'all'], queryFn: () => adminApi.structures.matieres.list().then((r) => r.data.data as Matiere[]) });
  const mutation = useMutation({
    mutationFn: () => adminApi.structures.matieres.create(form),
    onSuccess: () => { toast.success('Matière créée'); qc.invalidateQueries({ queryKey: ['structures', 'matieres'] }); setOpen(false); },
    onError: () => toast.error('Échec de la création'),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle matière</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((m) => (
          <Card key={m.id}><CardContent className="p-4"><p className="font-medium">{m.nom}</p><p className="text-xs text-muted-foreground">{m.module?.nom} · Coeff. {m.coefficient} · {m.creditsEcts} ECTS</p></CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle matière</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Module</Label>
              <Select value={form.moduleId} onValueChange={(v) => setForm({ ...form, moduleId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{modules?.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Coefficient</Label><Input type="number" min={0.5} step={0.5} value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Crédits ECTS</Label><Input type="number" min={1} value={form.creditsEcts} onChange={(e) => setForm({ ...form, creditsEcts: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button loading={mutation.isPending} disabled={!form.moduleId} onClick={() => mutation.mutate()}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SallesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', capacite: 30, type: 'SALLE_COURS' });

  const { data } = useQuery({ queryKey: ['structures', 'salles'], queryFn: () => adminApi.structures.salles.list().then((r) => r.data.data as { id: string; nom: string; capacite: number; type: string }[]) });
  const mutation = useMutation({
    mutationFn: () => adminApi.structures.salles.create(form),
    onSuccess: () => { toast.success('Salle créée'); qc.invalidateQueries({ queryKey: ['structures', 'salles'] }); setOpen(false); },
    onError: () => toast.error('Échec de la création'),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle salle</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((s) => (
          <Card key={s.id}><CardContent className="p-4"><p className="font-medium">{s.nom}</p><p className="text-xs text-muted-foreground">{s.type} · {s.capacite} places</p></CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle salle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="space-y-2"><Label>Capacité</Label><Input type="number" min={1} value={form.capacite} onChange={(e) => setForm({ ...form, capacite: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMPHITHEATRE">Amphithéâtre</SelectItem>
                  <SelectItem value="LABO">Laboratoire</SelectItem>
                  <SelectItem value="SALLE_COURS">Salle de cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StructuresPage() {
  return (
    <div>
      <PageHeader title="Structures académiques" description="Filières, modules, matières et salles de l'établissement" />
      <Tabs defaultValue="filieres">
        <TabsList>
          <TabsTrigger value="filieres">Filières</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="matieres">Matières</TabsTrigger>
          <TabsTrigger value="salles">Salles</TabsTrigger>
        </TabsList>
        <TabsContent value="filieres"><FilieresTab /></TabsContent>
        <TabsContent value="modules"><ModulesTab /></TabsContent>
        <TabsContent value="matieres"><MatieresTab /></TabsContent>
        <TabsContent value="salles"><SallesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
