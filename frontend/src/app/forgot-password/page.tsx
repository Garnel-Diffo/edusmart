'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Mail, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onError: () => toast.error('Une erreur est survenue, veuillez réessayer'),
  });

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #050c1c 0%, #080f22 40%, #06101e 100%)' }}
    >
      {/* ── Blobs ─────────────────────────────────────────────────── */}
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

      {/* ── Dot grid ──────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* ── Center layout ─────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-7 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">EduSmart</span>
          </div>

          {/* Glass card */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Top glare */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }}
            />

            <div className="p-7 sm:p-8">
              {/* Card header */}
              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
                    <Mail className="h-[18px] w-[18px] text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-[1.05rem] font-bold leading-none text-white">Mot de passe oublié</h2>
                    <p className="mt-0.5 text-[0.72rem] text-white/55">Réinitialisation par email</p>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-blue-500/35 via-purple-500/20 to-transparent" />
              </div>

              <AnimatePresence mode="wait">
                {mutation.isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="flex flex-col items-center gap-4 py-4 text-center"
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Email envoyé !</p>
                      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-white/65">
                        Si cet email existe dans nos systèmes, un lien de réinitialisation vous a été envoyé.
                        Vérifiez votre boîte de réception.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
                    className="space-y-4"
                  >
                    <p className="text-[0.78rem] leading-relaxed text-white/60">
                      Saisissez votre email institutionnel, un lien de réinitialisation vous sera envoyé.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-[0.68rem] font-semibold uppercase tracking-widest text-white/40">
                        Email institutionnel
                      </label>
                      <div className="relative">
                        <Mail
                          className={`absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 transition-colors duration-200 ${
                            focused ? 'text-blue-400' : 'text-white/25'
                          }`}
                        />
                        <input
                          type="email"
                          placeholder="vous@etablissement.cm"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          required
                          autoFocus
                          className={`w-full rounded-xl border py-[0.72rem] pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/18 caret-blue-400 bg-white/[0.05] ${
                            focused
                              ? 'border-blue-500/55 bg-blue-500/[0.07] shadow-[0_0_0_3px_rgba(59,130,246,0.10)]'
                              : 'border-white/[0.09] hover:border-white/[0.16]'
                          }`}
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={mutation.isPending || !email}
                      whileHover={!mutation.isPending ? { scale: 1.015, y: -1 } : undefined}
                      whileTap={!mutation.isPending ? { scale: 0.985 } : undefined}
                      className="group relative mt-1.5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #4338ca 100%)',
                        boxShadow: '0 4px 24px rgba(59,130,246,0.30)',
                      }}
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      {mutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Envoyer le lien
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Back to login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-center"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-white/40 transition-colors hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
