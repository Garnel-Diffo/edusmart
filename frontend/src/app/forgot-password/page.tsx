'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onError: () => toast.error('Une erreur est survenue, veuillez réessayer'),
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/login" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez votre email, un lien de réinitialisation vous sera envoyé.
        </p>

        <Card className="mt-6">
          <CardContent className="p-6">
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="text-sm">
                  Si cet email existe dans nos systèmes, un lien de réinitialisation a été envoyé. Vérifiez votre
                  boîte de réception.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email institutionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" loading={mutation.isPending}>
                  Envoyer le lien
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
