'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getInitials, roleLabel } from '@/lib/utils';
import type { User, PaginatedResponse, Role, Filiere } from '@/types';

const ROLES: Role[] = ['ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE'];

export default function AdminUtilisateursPage() {
  const qc = useQueryClient();
  const [recherche, setRecherche] = useState('');
  const [roleFiltre, setRoleFiltre] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'ETUDIANT' as Role, matricule: '', filiereId: '', anneeEntree: new Date().getFullYear() });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'utilisateurs', recherche, roleFiltre],
    queryFn: () => adminApi.users.list({ q: recherche || undefined, role: roleFiltre || undefined, pageSize: 50 }).then((r) => r.data as PaginatedResponse<User>),
  });

  const { data: filieres } = useQuery({
    queryKey: ['structures', 'filieres'],
    queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.users.create(form),
    onSuccess: () => {
      toast.success('Utilisateur créé, un email avec ses identifiants a été envoyé');
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] });
      setDialogOpen(false);
      setForm({ nom: '', prenom: '', email: '', role: 'ETUDIANT', matricule: '', filiereId: '', anneeEntree: new Date().getFullYear() });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la création';
      toast.error(message);
    },
  });

  const toggleStatutMutation = useMutation({
    mutationFn: ({ id, statutCompte }: { id: string; statutCompte: string }) => adminApi.users.update(id, { statutCompte }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la mise à jour';
      toast.error(message);
    },
  });

  const toggleDelegueMutation = useMutation({
    mutationFn: ({ id, estDelegue }: { id: string; estDelegue: boolean }) => adminApi.users.setDelegue(id, estDelegue),
    onSuccess: () => {
      toast.success('Statut de délégué mis à jour');
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la mise à jour';
      toast.error(message);
    },
  });

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes étudiants, enseignants et administrateurs"
        action={<Button onClick={() => setDialogOpen(true)}><UserPlus className="h-4 w-4" /> Nouvel utilisateur</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par nom, prénom, email..." className="pl-9" />
        </div>
        <Select value={roleFiltre} onValueChange={setRoleFiltre}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && data?.data.length === 0 && <EmptyState icon={Users} title="Aucun utilisateur trouvé" />}

      <div className="space-y-2">
        {data?.data.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback>{getInitials(u.nom, u.prenom)}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-medium">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{roleLabel(u.role)}</Badge>
                  {u.etudiant && <span className="text-xs text-muted-foreground">{u.etudiant.matricule}</span>}
                  {u.etudiant && u.role === 'ETUDIANT' && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.etudiant.estDelegue}
                        onCheckedChange={(checked) => toggleDelegueMutation.mutate({ id: u.id, estDelegue: checked })}
                      />
                      <span className="text-xs text-muted-foreground">Délégué</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.statutCompte === 'ACTIF'}
                      onCheckedChange={(checked) => toggleStatutMutation.mutate({ id: u.id, statutCompte: checked ? 'ACTIF' : 'DESACTIVE' })}
                    />
                    <span className="text-xs text-muted-foreground">{u.statutCompte === 'ACTIF' ? 'Actif' : 'Désactivé'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Prénom</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.role === 'ETUDIANT' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>Matricule</Label><Input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Filière (niveau inclus)</Label>
                  <Select value={form.filiereId} onValueChange={(v) => setForm({ ...form, filiereId: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une filière" /></SelectTrigger>
                    <SelectContent>
                      {filieres?.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nom} - {f.code} (Niveau {f.niveau})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!form.nom || !form.prenom || !form.email || (form.role === 'ETUDIANT' && !form.filiereId)}
              onClick={() => createMutation.mutate()}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
