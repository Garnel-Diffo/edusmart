'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { KeyRound, Sun, Moon, Laptop } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THEMES = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Laptop },
] as const;

export default function ParametresPage() {
  const { theme, setTheme } = useTheme();
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(ancienMotDePasse, nouveauMotDePasse),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Échec de la modification';
      toast.error(message);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Paramètres" description="Sécurité du compte et préférences d'affichage" />

      <Card>
        <CardHeader><CardTitle className="text-base">Apparence</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
                theme === t.value ? 'border-primary bg-primary/5 font-medium text-primary' : 'hover:bg-accent',
              )}
            >
              <t.icon className="h-5 w-5" /> {t.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Changer de mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mot de passe actuel</Label>
            <Input type="password" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} placeholder="8 caractères min., une majuscule, un chiffre" />
          </div>
          <Button
            loading={changePasswordMutation.isPending}
            disabled={!ancienMotDePasse || !nouveauMotDePasse}
            onClick={() => changePasswordMutation.mutate()}
          >
            <KeyRound className="h-4 w-4" /> Modifier le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
