'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  Brain,
  BookOpen,
  CalendarDays,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bell,
  TrendingUp,
  FileText,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Data ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Brain,
    accent: '#8b5cf6',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    gradFrom: 'rgba(139,92,246,0.11)',
    label: 'Chatbot IA pédagogique',
    desc: 'Assistant RAG entraîné sur vos supports de cours. Répond avec précision ou s\'appuie sur ses connaissances générales, avec disclosure explicite.',
  },
  {
    Icon: BookOpen,
    accent: '#3b82f6',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    gradFrom: 'rgba(59,130,246,0.11)',
    label: 'Cours & documents',
    desc: 'PDF, PPTX et DOCX indexés automatiquement par vecteur sémantique. Fiches de révision et quiz générés à la demande.',
  },
  {
    Icon: CalendarDays,
    accent: '#06b6d4',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    gradFrom: 'rgba(6,182,212,0.11)',
    label: 'Emplois du temps',
    desc: 'Upload d\'image ou PDF par filière et semestre. Consultation temps réel avec notifications push instantanées.',
  },
  {
    Icon: BarChart3,
    accent: '#10b981',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    gradFrom: 'rgba(16,185,129,0.11)',
    label: 'Résultats & bulletins',
    desc: 'Saisie des notes, calcul automatique des moyennes pondérées, génération et export PDF des bulletins.',
  },
] as const;

const ROLES = [
  {
    Icon: ShieldCheck,
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500/30',
    glow: 'rgba(59,130,246,0.07)',
    title: 'Administrateur',
    desc: 'Gérez l\'établissement au complet depuis un tableau de bord unifié.',
    perks: [
      'Création et gestion des comptes utilisateurs',
      'Structure académique : filières, matières, salles',
      'Tableau de bord statistiques en temps réel',
      'Publication des annonces officielles',
    ],
  },
  {
    Icon: BookOpen,
    iconColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/30',
    glow: 'rgba(139,92,246,0.07)',
    title: 'Enseignant',
    desc: 'Publiez vos cours, suivez vos classes, saisissez les notes.',
    perks: [
      'Upload de supports et indexation IA automatique',
      'Saisie et validation des notes par matière',
      'Consultation des emplois du temps par filière',
      'Statistiques et distribution des résultats',
    ],
  },
  {
    Icon: GraduationCap,
    iconColor: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/30',
    glow: 'rgba(6,182,212,0.07)',
    title: 'Étudiant',
    desc: 'Révisez intelligemment avec l\'IA et suivez vos résultats.',
    perks: [
      'Chatbot IA basé sur vos cours officiels',
      'Génération de fiches & quiz personnalisés',
      'Upload et OCR de documents personnels',
      'Bulletins de notes accessibles en ligne',
    ],
  },
] as const;

// ── Hero mockup ───────────────────────────────────────────────────────────

function HeroDashboard() {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[400px] lg:max-w-none"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(37,99,235,0.20) 0%, transparent 72%)',
          filter: 'blur(28px)',
        }}
      />

      {/* Floating card */}
      <motion.div
        animate={!prefersReduced ? { y: [0, -10, 0] } : {}}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.1] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.025) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
        >
          {/* Top glare */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent" />

          {/* Topbar */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
              >
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/85">EduSmart</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="h-3.5 w-3.5 text-white/35" />
                <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
              </div>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-500" />
            </div>
          </div>

          <div className="space-y-3 p-4">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icon: Users, label: 'Étudiants', value: '1 247', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { Icon: FileText, label: 'Cours indexés', value: '89', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { Icon: TrendingUp, label: 'Questions IA', value: '432', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-2 text-center"
                >
                  <div className={cn('mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-lg', s.bg)}>
                    <s.Icon className={cn('h-3 w-3', s.color)} />
                  </div>
                  <p className="text-[0.67rem] font-bold text-white/85">{s.value}</p>
                  <p className="text-[0.56rem] leading-tight text-white/32">{s.label}</p>
                </div>
              ))}
            </div>

            {/* AI chat bubble */}
            <div className="rounded-xl border border-violet-500/18 bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-3">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                  <Brain className="h-3 w-3 text-violet-400" />
                </div>
                <div>
                  <p className="mb-0.5 text-[0.62rem] font-semibold text-white/65">Assistant IA pédagogique</p>
                  <p className="text-[0.65rem] leading-relaxed text-white/45">
                    Le théorème de Bayes établit que P(A|B)&nbsp;=&nbsp;P(B|A)·P(A)/P(B), ce qui permet…
                  </p>
                </div>
              </div>
            </div>

            {/* Notification feed */}
            <div className="space-y-1.5">
              {[
                { text: 'EDT Semestre 2 mis à jour', time: 'il y a 5 min', dot: 'bg-blue-400' },
                { text: 'Notes de Mathématiques publiées', time: 'il y a 1 h', dot: 'bg-emerald-400' },
              ].map((n) => (
                <div
                  key={n.text}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2"
                >
                  <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', n.dot)} />
                  <p className="flex-1 text-[0.62rem] text-white/50">{n.text}</p>
                  <p className="shrink-0 text-[0.58rem] text-white/22">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge — top right */}
      <motion.div
        animate={!prefersReduced ? { y: [0, 7, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute -right-3 -top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 shadow-xl backdrop-blur-md sm:-right-5"
      >
        <Sparkles className="h-3 w-3 text-yellow-300" />
        <span className="text-[0.65rem] font-semibold text-white/80">IA Groq + RAG</span>
      </motion.div>

      {/* Floating chip — bottom left */}
      <motion.div
        animate={!prefersReduced ? { y: [0, -7, 0] } : {}}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute -bottom-4 -left-3 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 shadow-xl backdrop-blur-md sm:-left-5"
      >
        <Zap className="h-3 w-3 text-emerald-400" />
        <span className="text-[0.65rem] font-semibold text-emerald-300/80">Temps réel</span>
      </motion.div>
    </motion.div>
  );
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-70px' });
  return (
    <div ref={ref} className="mx-auto max-w-2xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-300/90"
      >
        <Sparkles className="h-3 w-3" />
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.16, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3 text-base leading-relaxed text-white/42"
      >
        {sub}
      </motion.p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const prefersReduced = useReducedMotion();

  const featuresRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-60px' });
  const rolesInView = useInView(rolesRef, { once: true, margin: '-60px' });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(150deg, #050c1c 0%, #080f22 40%, #06101e 100%)' }}
    >
      {/* ── Animated blobs ──────────────────────────────────────── */}
      {!prefersReduced && (
        <>
          <motion.div
            className="pointer-events-none fixed -left-80 -top-80 h-[800px] w-[800px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(37,99,235,0.17) 0%, transparent 60%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, 55, 0], y: [0, 38, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none fixed -right-64 top-[12%] h-[700px] w-[700px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(79,70,229,0.13) 0%, transparent 60%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, -48, 0], y: [0, 58, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
          />
          <motion.div
            className="pointer-events-none fixed bottom-[5%] left-[22%] h-[550px] w-[550px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 60%)',
              filter: 'blur(1px)',
            }}
            animate={{ x: [0, 32, 0], y: [0, -42, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 13 }}
          />
        </>
      )}

      {/* ── Dot grid ────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 30%, black 25%, transparent 100%)',
        }}
      />

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 z-50 w-full"
        style={{
          background: 'rgba(5, 12, 28, 0.72)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
            >
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">EduSmart</span>
          </div>

          <Link
            href="/login"
            className="group flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
          >
            Se connecter
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.nav>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="relative z-10">

        {/* ══ Hero ═══════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36 lg:pt-40">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_440px] lg:gap-16">

            {/* Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-300/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Propulsé par l&apos;Intelligence Artificielle
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
                className="text-[2.35rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.1rem]"
              >
                La gestion scolaire{' '}
                <span
                  style={{
                    background:
                      'linear-gradient(100deg, #60a5fa 0%, #a78bfa 48%, #38bdf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  réinventée.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 max-w-md text-base leading-relaxed text-white/42"
              >
                Cours, emplois du temps, bulletins de notes et chatbot IA pédagogique —
                tout votre établissement unifié dans une seule plateforme moderne, temps réel.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/login"
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/30"
                  style={{
                    background:
                      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #4338ca 100%)',
                    boxShadow: '0 4px 24px rgba(59,130,246,0.28)',
                  }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Accéder à la plateforme
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Découvrir les fonctionnalités
                </a>
              </motion.div>

              {/* Trust chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-7 flex flex-wrap items-center gap-4"
              >
                {[
                  'Open Source & souverain',
                  'Déploiement cloud',
                  'Données chiffrées',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-[0.7rem] text-white/32">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Mockup */}
            <HeroDashboard />
          </div>
        </section>

        {/* ── Soft separator ──────────────────────────────────── */}
        <div className="pointer-events-none mx-auto max-w-6xl px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>

        {/* ══ Features ════════════════════════════════════════════ */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeader
            eyebrow="Fonctionnalités clés"
            title={
              <>
                Tout ce dont votre{' '}
                <br className="hidden sm:block" />
                établissement a besoin
              </>
            }
            sub="Une plateforme complète qui couvre chaque aspect de la vie scolaire numérique, de l'administration à la révision assistée par IA."
          />

          <div ref={featuresRef} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 28 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.09, duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-all duration-300 hover:border-white/[0.14]"
                style={{
                  background: `linear-gradient(140deg, ${f.gradFrom} 0%, rgba(255,255,255,0.015) 100%)`,
                }}
              >
                {/* Corner glow on hover */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, ${f.accent}28 0%, transparent 70%)`,
                  }}
                />

                <div
                  className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-xl',
                    f.iconBg,
                  )}
                >
                  <f.Icon className={cn('h-5 w-5', f.iconColor)} />
                </div>
                <h3 className="mb-2 text-[0.85rem] font-semibold text-white/90">{f.label}</h3>
                <p className="text-[0.75rem] leading-relaxed text-white/38">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Soft separator ──────────────────────────────────── */}
        <div className="pointer-events-none mx-auto max-w-6xl px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>

        {/* ══ Roles ═══════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeader
            eyebrow="Pour chaque acteur"
            title={
              <>
                Une expérience{' '}
                <span
                  style={{
                    background: 'linear-gradient(100deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  sur-mesure
                </span>
              </>
            }
            sub="Administrateur, enseignant ou étudiant — chaque profil dispose d'un espace dédié avec les outils adaptés à ses besoins."
          />

          <div ref={rolesRef} className="mt-12 grid gap-5 md:grid-cols-3">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 26 }}
                animate={rolesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-white/[0.07] p-6',
                  'transition-all duration-300',
                  r.borderHover,
                )}
                style={{
                  background: `radial-gradient(ellipse 85% 55% at 50% 0%, ${r.glow} 0%, rgba(255,255,255,0.013) 100%)`,
                }}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.05]">
                  <r.Icon className={cn('h-5 w-5', r.iconColor)} />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-white/90">{r.title}</h3>
                <p className="mb-5 text-[0.78rem] leading-relaxed text-white/38">{r.desc}</p>
                <ul className="space-y-2">
                  {r.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[0.76rem] text-white/48">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/55" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ CTA Banner ══════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 pb-28 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.09] px-8 py-14 text-center sm:px-14"
            style={{
              background:
                'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(79,70,229,0.13) 50%, rgba(14,165,233,0.09) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Glares */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/08 to-transparent" />

            <motion.div
              animate={!prefersReduced ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
              }}
            >
              <Zap className="h-6 w-6 text-white" />
            </motion.div>

            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
              Prêt à moderniser votre établissement ?
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-white/42">
              Connectez-vous dès maintenant et découvrez une nouvelle façon de gérer votre école.
            </p>
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background:
                  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #4338ca 100%)',
                boxShadow: '0 4px 32px rgba(59,130,246,0.38)',
              }}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Accéder à la plateforme
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        className="relative z-10 px-5 py-8 sm:px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
            >
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/55">EduSmart</span>
          </div>
          <p className="text-[0.68rem] text-white/18">
            © {new Date().getFullYear()} EduSmart — Plateforme de gestion scolaire intelligente
          </p>
          <Link
            href="/login"
            className="text-xs font-medium text-blue-400/55 transition-colors hover:text-blue-300"
          >
            Se connecter →
          </Link>
        </div>
      </footer>
    </div>
  );
}
