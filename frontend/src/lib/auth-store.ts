'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { setAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, accessToken: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: User, accessToken: string) => {
        setAccessToken(accessToken);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      updateUser: (partial: Partial<User>) => {
        set((state) => (state.user ? { user: { ...state.user, ...partial } } : state));
      },

      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'edusmart-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
