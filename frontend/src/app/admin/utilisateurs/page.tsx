'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Search, Users, ChevronRight, Shield, Eye, EyeOff, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getInitials, roleLabel } from '@/lib/utils';
import type { User, PaginatedResponse, Role, Filiere } from '@/types';

const ROLES: Role[] = ['ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE'];

const STATUT_OPTIONS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'DESACTIVE', label: 'Désactivé' },
  { value: 'VERROUILLE', label: 'Verrouillé' },
];

function statutBadgeVariant(statut: string) {
  if (statut === 'ACTIF') return 'default';
  if (statut === 'VERROUILLE') return 'destructive';
  return 'secondary';
}

function statutLabel(statut: string) {
  return STATUT_OPTIONS.find((o) => o.value === statut)?.label ?? statut;
}

function getFiliereActive(u: User) {
  return u.etudiant?.inscriptions?.[0]?.filiere ?? null;
}

export default function AdminUtilisateursPage() {
  const qc = useQueryClient();

  // ── Filtres ──────────────────────────────────────────────────────────
  const [recherche, setRecherche] = useState('');
  const [roleFiltre, setRoleFiltre] = useState<string>('');
  const [filiereFiltre, setFiliereFiltre] = useState<string>('');

  // ── Création ─────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nom: '', prenom: '', email: '', role: 'ETUDIANT' as Role,
    matricule: '', filiereId: '', anneeEntree: new Date().getFullYear(),
  });

  // ── Édition ──────────────────────────────────────────────────────────
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    statutCompte: 'ACTIF', nouveauMotDePasse: '', confirmerMotDePasse: '',
    estDelegue: false,
  });
  const [showPwd, setShowPwd] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'utilisateurs', recherche, roleFiltre],
    queryFn: () => adminApi.users.list({ q: recherche || undefined, role: roleFiltre || undefined, pageSize: 100 }).then((r) => r.data as PaginatedResponse<User>),
  });

  const { data: filieres } = useQuery({
    queryKey: ['structures', 'filieres'],
    queryFn: () => adminApi.structures.filieres.list().then((r) => r.data.data as Filiere[]),
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => adminApi.users.create(createForm),
    onSuccess: () => {
      toast.success('Utilisateur créé - un email avec ses identifiants a été envoyé');
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] });
      setCreateOpen(false);
      setCreateForm({ nom: '', prenom: '', email: '', role: 'ETUDIANT', matricule: '', filiereId: '', anneeEntree: new Date().getFullYear() });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.users.update(editUser!.id, payload),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour');
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] });
      setEditUser(null);
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la mise à jour'),
  });

  const toggleDelegueMutation = useMutation({
    mutationFn: ({ id, estDelegue }: { id: string; estDelegue: boolean }) => adminApi.users.setDelegue(id, estDelegue),
    onSuccess: () => { toast.success('Statut de délégué mis à jour'); qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec'),
  });

  // ── Filtrage + tri client-side ────────────────────────────────────────
  const utilisateurs = useMemo(() => {
    let list = data?.data ?? [];

    if (filiereFiltre && roleFiltre === 'ETUDIANT') {
      list = list.filter((u) => getFiliereActive(u)?.id === filiereFiltre);
    }

    if (roleFiltre === 'ETUDIANT') {
      list = [...list].sort((a, b) => {
        const fa = getFiliereActive(a)?.nom ?? '';
        const fb = getFiliereActive(b)?.nom ?? '';
        if (fa !== fb) return fa.localeCompare(fb);
        return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
      });
    }

    return list;
  }, [data, filiereFiltre, roleFiltre]);

  // ── Groupement par filière (mode Étudiant) ───────────────────────────
  const grouped = useMemo(() => {
    if (roleFiltre !== 'ETUDIANT') return null;
    const map = new Map<string, { label: string; users: User[] }>();
    for (const u of utilisateurs) {
      const f = getFiliereActive(u);
      const key = f?.id ?? '__aucune__';
      const label = f ? `${f.nom} - ${f.code} (Niveau ${f.niveau})` : 'Aucune filière active';
      if (!map.has(key)) map.set(key, { label, users: [] });
      map.get(key)!.users.push(u);
    }
    return Array.from(map.entries()).map(([, v]) => v);
  }, [utilisateurs, roleFiltre]);

  // ── Ouvrir dialog édition ────────────────────────────────────────────
  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone ?? '',
      statutCompte: u.statutCompte,
      nouveauMotDePasse: '',
      confirmerMotDePasse: '',
      estDelegue: u.etudiant?.estDelegue ?? false,
    });
    setShowPwd(false);
  }

  function handleSaveEdit() {
    if (editForm.nouveauMotDePasse && editForm.nouveauMotDePasse !== editForm.confirmerMotDePasse) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    const payload: Record<string, unknown> = {
      nom: editForm.nom,
      prenom: editForm.prenom,
      email: editForm.email,
      telephone: editForm.telephone || undefined,
      statutCompte: editForm.statutCompte,
    };
    if (editForm.nouveauMotDePasse) payload.nouveauMotDePasse = editForm.nouveauMotDePasse;
    updateMutation.mutate(payload);

    if (editUser?.role === 'ETUDIANT' && editForm.estDelegue !== editUser.etudiant?.estDelegue) {
      toggleDelegueMutation.mutate({ id: editUser.id, estDelegue: editForm.estDelegue });
    }
  }

  // ── Render d'une ligne utilisateur ───────────────────────────────────
  function UserRow({ u, i }: { u: User; i: number }) {
    const filiere = getFiliereActive(u);
    return (
      <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/40"
          onClick={() => openEdit(u)}
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                  <AvatarFallback>{getInitials(u.nom, u.prenom)}</AvatarFallback>
                </Avatar>
                {u.etudiant?.estDelegue && (
                  <Crown className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-medium">{u.prenom} {u.nom}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                {filiere && roleFiltre !== 'ETUDIANT' && (
                  <p className="text-xs text-muted-foreground">{filiere.nom}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {u.etudiant?.matricule && (
                <span className="text-xs text-muted-foreground font-mono">{u.etudiant.matricule}</span>
              )}
              <Badge variant="outline">{roleLabel(u.role)}</Badge>
              <Badge variant={statutBadgeVariant(u.statutCompte)}>{statutLabel(u.statutCompte)}</Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes étudiants, enseignants et administrateurs"
        action={<Button onClick={() => setCreateOpen(true)}><UserPlus className="h-4 w-4" /> Nouvel utilisateur</Button>}
      />

      {/* ── Filtres ───────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par nom, prénom, email..." className="pl-9" />
        </div>
        <Select value={roleFiltre} onValueChange={(v) => { setRoleFiltre(v); setFiliereFiltre(''); }}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les rôles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
          </SelectContent>
        </Select>
        {roleFiltre === 'ETUDIANT' && (
          <Select value={filiereFiltre} onValueChange={setFiliereFiltre}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les filières</SelectItem>
              {filieres?.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nom} - {f.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Liste ─────────────────────────────────────────────────── */}
      {!isLoading && utilisateurs.length === 0 && <EmptyState icon={Users} title="Aucun utilisateur trouvé" />}

      {grouped ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
                <Badge variant="secondary" className="text-xs">{group.users.length}</Badge>
              </div>
              <div className="space-y-2">
                {group.users.map((u, i) => <UserRow key={u.id} u={u} i={i} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {utilisateurs.map((u, i) => <UserRow key={u.id} u={u} i={i} />)}
        </div>
      )}

      {/* ══ Dialog Création ═══════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Prénom</Label><Input value={createForm.prenom} onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nom</Label><Input value={createForm.nom} onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {createForm.role === 'ETUDIANT' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>Matricule</Label><Input value={createForm.matricule} onChange={(e) => setCreateForm({ ...createForm, matricule: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Filière (niveau inclus)</Label>
                  <Select value={createForm.filiereId} onValueChange={(v) => setCreateForm({ ...createForm, filiereId: v })}>
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!createForm.nom || !createForm.prenom || !createForm.email || (createForm.role === 'ETUDIANT' && !createForm.filiereId)}
              onClick={() => createMutation.mutate()}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Dialog Édition ════════════════════════════════════════════ */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {editUser?.avatarUrl && <AvatarImage src={editUser.avatarUrl} />}
                <AvatarFallback>{editUser ? getInitials(editUser.nom, editUser.prenom) : ''}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">{editUser?.prenom} {editUser?.nom}</p>
                <p className="text-xs font-normal text-muted-foreground">{editUser ? roleLabel(editUser.role) : ''}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">

            {/* ── Infos de base ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom</Label>
                <Input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom</Label>
                <Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} placeholder="Optionnel" />
            </div>

            {/* ── Infos en lecture seule (étudiant) ── */}
            {editUser?.etudiant && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Infos étudiant</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Matricule : </span><span className="font-mono">{editUser.etudiant.matricule}</span></div>
                  <div><span className="text-muted-foreground">Entrée : </span>{editUser.etudiant.anneeEntree}</div>
                  {getFiliereActive(editUser) && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Filière : </span>
                      {getFiliereActive(editUser)!.nom} - {getFiliereActive(editUser)!.code}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={editForm.estDelegue}
                    onCheckedChange={(v) => setEditForm({ ...editForm, estDelegue: v })}
                  />
                  <Label className="text-xs cursor-pointer flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    Délégué de filière
                  </Label>
                </div>
              </div>
            )}

            <Separator />

            {/* ── Statut du compte ── */}
            <div className="space-y-1.5">
              <Label className="text-xs">Statut du compte</Label>
              <Select value={editForm.statutCompte} onValueChange={(v) => setEditForm({ ...editForm, statutCompte: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* ── Réinitialisation mot de passe ── */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Lock className="h-3.5 w-3.5" />
                Changer le mot de passe
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Laisser vide pour ne pas modifier"
                    value={editForm.nouveauMotDePasse}
                    onChange={(e) => setEditForm({ ...editForm, nouveauMotDePasse: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {editForm.nouveauMotDePasse && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={editForm.confirmerMotDePasse}
                    onChange={(e) => setEditForm({ ...editForm, confirmerMotDePasse: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button loading={updateMutation.isPending} onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
