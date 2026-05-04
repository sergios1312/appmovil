/**
 * @file authStore.ts
 * @layer infrastructure/store
 * @description Store de Zustand para estado de autenticación Google OAuth.
 */

import { create } from 'zustand';
import { User, AuthStatus } from '@/core/entities/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@appmovil:auth_user';

interface AuthState {
  // Estado
  user: User | null;
  status: AuthStatus;
  error: string | null;

  // Acciones
  setUser: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unauthenticated',
  error: null,

  setUser: async (user: User) => {
    // Persistir en AsyncStorage para restaurar sesión al reabrir la app
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, status: 'authenticated', error: null });
  },

  signOut: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, status: 'unauthenticated', error: null });
  },

  restoreSession: async () => {
    set({ status: 'loading' });
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        set({ status: 'unauthenticated' });
        return;
      }

      const user: User = JSON.parse(stored);

      // Verificar que el token no haya expirado
      const isExpired = new Date(user.token_expires_at) < new Date();
      if (isExpired) {
        // TODO: implementar refresh token flow
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ status: 'unauthenticated' });
        return;
      }

      set({ user, status: 'authenticated' });
    } catch {
      set({ status: 'unauthenticated', error: 'Error restaurando sesión' });
    }
  },

  setStatus: (status: AuthStatus) => set({ status }),
  setError: (error: string | null) => set({ error }),
}));

// Selectores
export const selectIsAuthenticated = (state: AuthState) =>
  state.status === 'authenticated' && state.user !== null;

export const selectIsLoading = (state: AuthState) =>
  state.status === 'loading';
