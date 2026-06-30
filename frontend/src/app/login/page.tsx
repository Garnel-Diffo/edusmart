'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const home = user.role === 'ETUDIANT' ? '/etudiant' : user.role === 'ENSEIGNANT' ? '/enseignant' : '/admin';
      router.replace(home);
    }
  }, [isAuthenticated, user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({ email, motDePasse });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau visuel — masqué sur mobile (mobile-first : priorité au formulaire) */}
      <div className="relative hidden flex-col justify-between gradient-brand p-10 text-white lg:flex">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">EduSmart</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            La gestion scolaire intelligente, propulsée par l&apos;IA.
          </h2>
          <p className="mt-4 text-white/80">
            Cours, emplois du temps, notes et chatbot pédagogique RAG — tout votre établissement, dans une seule
            plateforme moderne et temps réel.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4" />
            <span>Assistant IA entraîné sur vos propres supports de cours</span>
          </div>
        </motion.div>

        <p className="text-xs text-white/50">© {new Date().getFullYear()} EduSmart — Tous droits réservés</p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">EduSmart</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accédez à votre espace EduSmart</p>

          <Card className="mt-6 border-0 shadow-none sm:border sm:shadow-sm">
            <CardContent className="p-0 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email institutionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@etablissement.cm"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="px-9"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={isLoggingIn}>
                  Se connecter
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Plateforme réservée aux membres de l&apos;établissement. Contactez l&apos;administration en cas de
            difficulté de connexion.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
