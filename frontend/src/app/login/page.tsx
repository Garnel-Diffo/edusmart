'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  CalendarDays,
  Brain,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

/* ─── Données features ────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: Brain,
    label: 'Chatbot IA pédagogique',
    desc: 'Assistant RAG entraîné sur vos propres supports de cours',
    color: 'from-violet-500/20 to-violet-500/5',
    iconColor: 'text-violet-400',
  },
  {
    Icon: BookOpen,
    label: 'Cours & documents',
    desc: 'PDF, PPTX et DOCX indexés automatiquement pour vos révisions',
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    Icon: CalendarDays,
    label: 'Emplois du temps',
    desc: 'Consultation et notifications temps réel par filière',
    color: 'from-cyan-500/20 to-cyan-500/5',
    iconColor: 'text-cyan-400',
  },
  {
    Icon: BarChart3,
    label: 'Résultats & bulletins',
    desc: 'Saisie, validation et génération automatique de bulletins',
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
] as const;

/* ─── Composant principal ─────────────────────────────────────────── */
export default function LoginPage() {
  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'pwd' | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const home =
        user.role === 'ETUDIANT'
          ? '/etudiant'
          : user.role === 'ENSEIGNANT'
            ? '/enseignant'
            : '/admin';
      router.replace(home);
    }
  }, [isAuthenticated, user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({ email, motDePasse });
  }

  /* ─── Rendu ─────────────────────────────────────────────────────── */
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #050c1c 0%, #080f22 40%, #06101e 100%)' }}
    >

      {/* ══ Blobs flottants ══════════════════════════════════════════ */}
      {!prefersReduced && (
        <>
          <motion.div
            className="pointer-events-none absolute -left-64 -top-64 h-[700px] w-[700px] rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(37,99,235,0.22) 0%, transparent 65%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, 50, 0], y: [0, 35, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-40 top-[20%] h-[600px] w-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(79,70,229,0.18) 0%, transparent 65%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, -45, 0], y: [0, 55, 0], scale: [1, 1.07, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-0 left-[30%] h-[500px] w-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(14,165,233,0.12) 0%, transparent 65%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
          />
        </>
      )}

      {/* ══ Grille de points décorative ══════════════════════════════ */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* ══ Ligne de séparation centrale (desktop) ═══════════════════ */}
      <div className="pointer-events-none absolute inset-y-0 hidden lg:flex" style={{ left: 'calc(100% - 480px - 1px)' }}>
        <div className="h-full w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
      </div>

      {/* ══ Layout ═══════════════════════════════════════════════════ */}
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1fr_480px]">

        {/* ── Colonne gauche : Branding ────────────────────────────── */}
        <div className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-16 xl:py-14">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EduSmart</span>
          </motion.div>

          {/* Headline + features */}
          <div className="max-w-xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-300/90 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Propulsé par l&apos;Intelligence Artificielle
            </motion.div>

            {/* Titre gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] font-bold leading-[1.12] tracking-tight text-white xl:text-[3.1rem]"
            >
              La gestion scolaire{' '}
              <span
                className="block"
                style={{
                  background: 'linear-gradient(100deg, #60a5fa 0%, #a78bfa 45%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                intelligente.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-base leading-relaxed text-white/45"
            >
              Cours, notes, emplois du temps et chatbot IA pédagogique - tout votre établissement dans une seule plateforme moderne et temps réel.
            </motion.p>

            {/* Grid features */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 + i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br p-4',
                    'backdrop-blur-sm transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.04]',
                    f.color,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                      <f.Icon className={cn('h-4 w-4', f.iconColor)} />
                    </div>
                    <div>
                      <p className="text-[0.8rem] font-semibold leading-tight text-white/90">{f.label}</p>
                      <p className="mt-1 text-[0.71rem] leading-relaxed text-white/65">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer gauche */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-white/20"
          >
            &copy; {new Date().getFullYear()} EduSmart - Plateforme de gestion scolaire intelligente
          </motion.p>
        </div>

        {/* ── Colonne droite : Formulaire ──────────────────────────── */}
        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >

            {/* Logo mobile uniquement */}
            <div className="mb-7 flex items-center gap-2.5 lg:hidden">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">EduSmart</span>
            </div>

            {/* ── Carte verre ──────────────────────────────────────── */}
            <div
              className="relative overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
              style={{
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Reflet supérieur */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                }}
              />

              <div className="p-7 sm:p-8">

                {/* En-tête carte */}
                <div className="mb-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
                      <ShieldCheck className="h-[18px] w-[18px] text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-[1.05rem] font-bold leading-none text-white">Connexion</h2>
                      <p className="mt-0.5 text-[0.72rem] text-white/55">Accédez à votre espace sécurisé</p>
                    </div>
                  </div>
                  {/* Séparateur dégradé */}
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-blue-500/35 via-purple-500/20 to-transparent" />
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[0.68rem] font-semibold uppercase tracking-widest text-white/40">
                      Email institutionnel
                    </label>
                    <div className="relative">
                      <Mail
                        className={cn(
                          'absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 transition-colors duration-200',
                          focused === 'email' ? 'text-blue-400' : 'text-white/25',
                        )}
                      />
                      <input
                        type="email"
                        placeholder="vous@etablissement.cm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        required
                        autoFocus
                        className={cn(
                          'w-full rounded-xl border py-[0.72rem] pl-10 pr-4 text-sm text-white outline-none transition-all duration-200',
                          'placeholder:text-white/18 caret-blue-400',
                          'bg-white/[0.05]',
                          focused === 'email'
                            ? 'border-blue-500/55 bg-blue-500/[0.07] shadow-[0_0_0_3px_rgba(59,130,246,0.10)]'
                            : 'border-white/[0.09] hover:border-white/[0.16]',
                        )}
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[0.68rem] font-semibold uppercase tracking-widest text-white/40">
                        Mot de passe
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[0.72rem] font-medium text-blue-400/75 transition-colors hover:text-blue-300"
                      >
                        Oublié ?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock
                        className={cn(
                          'absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 transition-colors duration-200',
                          focused === 'pwd' ? 'text-blue-400' : 'text-white/25',
                        )}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        onFocus={() => setFocused('pwd')}
                        onBlur={() => setFocused(null)}
                        required
                        className={cn(
                          'w-full rounded-xl border py-[0.72rem] pl-10 pr-10 text-sm text-white outline-none transition-all duration-200',
                          'placeholder:text-white/18 caret-blue-400',
                          'bg-white/[0.05]',
                          focused === 'pwd'
                            ? 'border-blue-500/55 bg-blue-500/[0.07] shadow-[0_0_0_3px_rgba(59,130,246,0.10)]'
                            : 'border-white/[0.09] hover:border-white/[0.16]',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[15px] w-[15px]" />
                        ) : (
                          <Eye className="h-[15px] w-[15px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bouton submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoggingIn || !email || !motDePasse}
                    whileHover={!isLoggingIn ? { scale: 1.015, y: -1 } : undefined}
                    whileTap={!isLoggingIn ? { scale: 0.985 } : undefined}
                    className={cn(
                      'group relative mt-1.5 flex w-full items-center justify-center gap-2 overflow-hidden',
                      'rounded-xl py-3 text-sm font-semibold text-white shadow-lg',
                      'transition-all duration-300',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #4338ca 100%)',
                      boxShadow: '0 4px 24px rgba(59,130,246,0.30)',
                    }}
                  >
                    {/* Shimmer au hover */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <AnimatePresence mode="wait">
                      {isLoggingIn ? (
                        <motion.div
                          key="spin"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        />
                      ) : (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          Se connecter
                          <motion.span
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Note de pied */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-5 text-center text-[0.7rem] leading-relaxed text-white/20"
            >
              Plateforme réservée aux membres de l&apos;établissement.
              <br />
              Contactez l&apos;administration en cas de difficulté de connexion.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
