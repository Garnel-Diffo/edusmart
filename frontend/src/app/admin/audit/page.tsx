'use client';

import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, X, SlidersHorizontal } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import type { PaginatedResponse } from '@/types';

// ── Types ───────────────────────────────────────────────────────────────────

interface AuditAuteur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entite: string;
  entiteId: string | null;
  donneesAvant: unknown;
  donneesApres: unknown;
  ip: string | null;
  createdAt: string;
  utilisateur: AuditAuteur | null;
}

interface FilterOptions {
  actions: string[];
  entites: string[];
}

// ── Helpers visuels ─────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATE:                   { label: 'Création',             color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  UPDATE:                   { label: 'Modification',         color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  DELETE:                   { label: 'Suppression',          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  UPLOAD:                   { label: 'Dépôt fichier',        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  PUBLISH:                  { label: 'Publication',          color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  LOGIN_SUCCESS:            { label: 'Connexion',            color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  COMPTE_VERROUILLE:        { label: 'Compte verrouillé',    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  SAISIE_NOTES:             { label: 'Saisie notes',         color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  VALIDATION_NOTES:         { label: 'Validation notes',     color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REFUS_VALIDATION_NOTES:   { label: 'Refus validation',     color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  GENERATION_BULLETINS_PV:  { label: 'Génération bulletins', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  EDT_DEPOSE:               { label: 'EDT déposé',           color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  EDT_REMPLACE:             { label: 'EDT remplacé',         color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  CHANGER_FILIERE:          { label: 'Changement filière',   color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  SET_DELEGUE:              { label: 'Délégué désigné',      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  UNSET_DELEGUE:            { label: 'Délégué retiré',       color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  PASSWORD_CHANGE:          { label: 'Changement mdp',       color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  PASSWORD_RESET:           { label: 'Réinit. mdp',          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  PROFILE_UPDATE:           { label: 'Profil mis à jour',    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
};

function actionBadge(action: string) {
  const meta = ACTION_META[action];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', meta?.color ?? 'bg-muted text-muted-foreground')}>
      {meta?.label ?? action}
    </span>
  );
}

function entiteLabel(entite: string): string {
  const MAP: Record<string, string> = {
    Utilisateur: 'Utilisateur',
    Module: 'Module',
    Matiere: 'Matière',
    Filiere: 'Filière',
    Salle: 'Salle',
    Note: 'Note',
    Inscription: 'Inscription',
    CoursDocument: 'Cours',
    Annonce: 'Annonce',
    EmploiDuTemps: 'Emploi du temps',
  };
  return MAP[entite] ?? entite;
}

function JsonDiff({ avant, apres }: { avant: unknown; apres: unknown }) {
  const formatJson = (v: unknown) => {
    if (v == null) return null;
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  };
  const avantStr = formatJson(avant);
  const apresStr = formatJson(apres);
  if (!avantStr && !apresStr) return <p className="text-xs text-muted-foreground italic">Aucune donnée</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {avantStr && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Avant</p>
          <pre className="overflow-auto rounded-md bg-red-50 p-3 text-[11px] text-red-900 dark:bg-red-950/30 dark:text-red-300 max-h-48">{avantStr}</pre>
        </div>
      )}
      {apresStr && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Après</p>
          <pre className="overflow-auto rounded-md bg-emerald-50 p-3 text-[11px] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 max-h-48">{apresStr}</pre>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [entite, setEntite] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: opts } = useQuery({
    queryKey: ['admin', 'audit', 'options'],
    queryFn: () => adminApi.audit.filterOptions().then((r) => r.data.data as FilterOptions),
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', q, action, entite, dateDebut, dateFin, page],
    queryFn: () =>
      adminApi.audit.list({ q: q || undefined, action: action || undefined, entite: entite || undefined, dateDebut: dateDebut || undefined, dateFin: dateFin || undefined, page, pageSize: 25 })
        .then((r) => r.data as PaginatedResponse<AuditLog>),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  function resetFiltres() {
    setQ(''); setAction(''); setEntite(''); setDateDebut(''); setDateFin(''); setPage(1);
  }

  const hasFiltres = q || action || entite || dateDebut || dateFin;

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        description="Historique de toutes les actions sensibles effectuées sur la plateforme"
      />

      {/* ── Filtres ─────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Rechercher par utilisateur..."
                className="pl-8"
              />
            </div>

            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les actions</SelectItem>
                {opts?.actions.map((a) => (
                  <SelectItem key={a} value={a}>{ACTION_META[a]?.label ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entite} onValueChange={(v) => { setEntite(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les entités</SelectItem>
                {opts?.entites.map((e) => (
                  <SelectItem key={e} value={e}>{entiteLabel(e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground">→</span>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
                className="w-36"
              />
            </div>

            {hasFiltres && (
              <Button variant="ghost" size="sm" onClick={resetFiltres} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            )}
          </div>

          {pagination && (
            <p className="mt-2 text-xs text-muted-foreground">
              {pagination.total} entrée{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Tableau ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-40">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3 w-44">Action</th>
              <th className="px-4 py-3 w-32">Entité</th>
              <th className="px-4 py-3 w-20 text-center">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement...</td>
              </tr>
            )}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Aucune entrée trouvée</td>
              </tr>
            )}
            {logs.map((log) => (
              <Fragment key={log.id}>
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn('transition-colors hover:bg-muted/30', expandedId === log.id && 'bg-muted/40')}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    {log.utilisateur ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {log.utilisateur.avatarUrl && <AvatarImage src={log.utilisateur.avatarUrl} />}
                          <AvatarFallback className="text-[9px]">{getInitials(log.utilisateur.nom, log.utilisateur.prenom)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-tight">{log.utilisateur.prenom} {log.utilisateur.nom}</p>
                          <p className="text-[11px] text-muted-foreground">{log.utilisateur.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Système</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{actionBadge(log.action)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <Badge variant="outline" className="text-xs">{entiteLabel(log.entite)}</Badge>
                      {log.entiteId && (
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]" title={log.entiteId}>
                          {log.entiteId.slice(0, 12)}…
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(log.donneesAvant != null || log.donneesApres != null) && (
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Voir détails"
                      >
                        {expandedId === log.id
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </td>
                </motion.tr>

                <AnimatePresence>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-4 pt-2 bg-muted/20">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2">
                            {log.ip && (
                              <p className="text-[11px] text-muted-foreground">IP : <span className="font-mono">{log.ip}</span></p>
                            )}
                            <JsonDiff avant={log.donneesAvant} apres={log.donneesApres} />
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, pagination.page - 2);
              const p = start + i;
              if (p > pagination.totalPages) return null;
              return (
                <Button key={p} variant={p === pagination.page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
