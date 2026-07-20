import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthStatus } from '@/core/entities/User';
import { upsertProfile } from '@/infrastructure/services/supabaseProfile';

const AUTH_STORAGE_KEY = '@appmovil:auth_user';

interface AuthState {
  // Estado
  user: User | null;
  status: AuthStatus;
  error: string | null;

  // Propiedad derivada para facilidad (usada en _layout)
  accessToken: string | null;

  // Acciones
  setUser: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading' as AuthStatus,
  error: null,
  accessToken: null,

  setUser: async (user: User) => {
    // Persistir en AsyncStorage
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, accessToken: user.access_token, status: 'authenticated', error: null });

    // Sincronizar perfil con Supabase en segundo plano
    void upsertProfile({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    }).catch(err => console.error('[AuthStore] Error syncing profile to Supabase:', err));
  },

  signOut: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, accessToken: null, status: 'unauthenticated', error: null });
  },

  restoreSession: async () => {
    set({ status: 'loading' });
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        set({ status: 'unauthenticated', accessToken: null });
        return;
      }

      const user: User = JSON.parse(stored);

      // Verificar que el token no haya expirado
      const isExpired = new Date(user.token_expires_at) < new Date();
      if (isExpired) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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

export const selectIsAuthenticated = (state: AuthState) =>
  state.status === 'authenticated' && state.user !== null;

export const selectIsLoading = (state: AuthState) =>
  state.status === 'loading';
