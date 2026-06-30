'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { authApi } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { queryClient } from '@/lib/query-client';
import { toast } from 'sonner';
import type { LoginResponse, Role } from '@/types';

function dashboardPath(role: Role): string {
  if (role === 'ETUDIANT') return '/etudiant';
  if (role === 'ENSEIGNANT') return '/enseignant';
  return '/admin';
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: ({ email, motDePasse }: { email: string; motDePasse: string }) =>
      authApi.login(email, motDePasse).then((res) => res.data as LoginResponse),
    onSuccess: ({ user: loggedUser, accessToken }) => {
      setUser(loggedUser, accessToken);
      connectSocket(accessToken);
      toast.success(`Bienvenue, ${loggedUser.prenom} !`);
      router.push(dashboardPath(loggedUser.role));
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Identifiants invalides';
      toast.error(message);
    },
  });

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* token déjà expiré */ }
    clearAuth();
    disconnectSocket();
    queryClient.clear();
    router.push('/login');
  }, [clearAuth, router]);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await authApi.refresh();
      setUser(data.user, data.accessToken);
      connectSocket(data.accessToken);
    } catch {
      clearAuth();
    }
  }, [setUser, clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout,
    refreshSession,
    isAdmin: user?.role === 'ADMIN_SCOLAIRE' || user?.role === 'SUPER_ADMIN',
    isEnseignant: user?.role === 'ENSEIGNANT',
    isEtudiant: user?.role === 'ETUDIANT',
  };
}
