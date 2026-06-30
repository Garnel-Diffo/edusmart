'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { iaApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SourceDocument } from '@/types';

interface SearchResultPayload {
  resultats: SourceDocument[];
  modeDegrade: boolean;
}

export default function RecherchePage() {
  const [requete, setRequete] = useState('');
  const [resultats, setResultats] = useState<SourceDocument[] | null>(null);
  const [modeDegrade, setModeDegrade] = useState(false);

  const mutation = useMutation({
    mutationFn: () => iaApi.search(requete).then((r) => r.data as SearchResultPayload),
    onSuccess: (data) => {
      setResultats(data.resultats);
      setModeDegrade(data.modeDegrade);
    },
    onError: () => toast.error('La recherche a échoué, veuillez réessayer'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requete.trim().length < 3) {
      toast.error('Veuillez saisir au moins 3 caractères');
      return;
    }
    mutation.mutate();
  }

  return (
    <div>
      <PageHeader title="Recherche sémantique" description="Recherchez un concept dans l'ensemble des cours indexés de votre filière" />

      <form onSubmit={handleSubmit} className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Ex : injection de dépendances, normalisation de base de données..."
          className="h-12 pl-10 pr-28 text-base"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Rechercher
        </button>
      </form>

      {modeDegrade && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" /> Service IA indisponible : résultats issus de la recherche textuelle classique.
        </div>
      )}

      {mutation.isPending && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {resultats?.length === 0 && (
        <EmptyState icon={Search} title="Aucun résultat trouvé" description="Essayez de reformuler votre recherche avec d'autres termes." />
      )}

      <AnimatePresence>
        <div className="space-y-3">
          {resultats?.map((r, i) => (
            <motion.div key={`${r.coursDocumentId}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{r.titre}</span>
                    </div>
                    <Badge variant="outline">{(r.score * 100).toFixed(0)}% pertinent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.extrait}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
