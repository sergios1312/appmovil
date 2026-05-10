/**
 * @file authStore.ts — Web auth store with Supabase profile sync
 *
 * Mantiene el flujo de Google OAuth existente pero ahora también
 * persiste el perfil del usuario en Supabase (tabla profiles).
 */

import { create } from 'zustand';
import type { User, AuthStatus } from '@/core/entities/User';
import { upsertProfile } from '@/services/supabaseProfile';

const AUTH_STORAGE_KEY = 'taskflow_auth_user';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  accessToken: string | null;

  setUser: (user: User) => void;
  signOut: () => void;
  restoreSession: () => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  error: null,
  accessToken: null,

  setUser: (user: User) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, accessToken: user.access_token, status: 'authenticated', error: null });

    // Sincronizar perfil con Supabase en segundo plano
    void upsertProfile({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    }).catch(err => console.error('[AuthStore] Error syncing profile to Supabase:', err));
  },

  signOut: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, accessToken: null, status: 'unauthenticated', error: null });
  },

  restoreSession: () => {
    set({ status: 'loading' });
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        set({ status: 'unauthenticated', accessToken: null });
        return;
      }
      const user: User = JSON.parse(stored);
      const isExpired = new Date(user.token_expires_at) < new Date();
      if (isExpired) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ status: 'unauthenticated', user: null, accessToken: null });
        return;
      }
      set({ user, accessToken: user.access_token, status: 'authenticated' });
    } catch {
      set({ status: 'unauthenticated', error: 'Error restaurando sesión' });
    }
  },

  setStatus: (status: AuthStatus) => set({ status }),
  setError: (error: string | null) => set({ error }),
}));
