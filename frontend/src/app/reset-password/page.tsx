'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword(token, nouveauMotDePasse),
    onSuccess: () => {
      toast.success('Mot de passe réinitialisé avec succès');
      setTimeout(() => router.push('/login'), 2000);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Lien invalide ou expiré';
      toast.error(message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nouveauMotDePasse !== confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choisissez un nouveau mot de passe sécurisé.</p>

        <Card className="mt-6">
          <CardContent className="p-6">
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="text-sm">Mot de passe modifié. Redirection vers la connexion...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="new" type="password" className="pl-9" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} required minLength={8} />
                  </div>
                  <p className="text-xs text-muted-foreground">8 caractères min., au moins une majuscule et un chiffre.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirm" type="password" className="pl-9" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!token}>
                  Réinitialiser le mot de passe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
