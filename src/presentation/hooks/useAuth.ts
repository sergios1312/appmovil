/**
 * @file useAuth.ts
 * @layer presentation/hooks
 * @description Hook de autenticación con Google OAuth para componentes de React.
 * Usa signInWithGoogle() (WebBrowser directo) en vez de useAuthRequest hooks.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/presentation/store/authStore';
import { signInWithGoogle, fetchGoogleUserInfo, GOOGLE_OAUTH_CONFIG } from '@/infrastructure/auth/googleAuth';
import { User } from '@/core/entities/User';

export function useAuth() {
  const { user, status, error, setUser, signOut, restoreSession, setStatus, setError } =
    useAuthStore();

  // Restaurar sesión al iniciar la app
  useEffect(() => {
    restoreSession();
  }, []);

  const signIn = async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await signInWithGoogle();

      if (!result) {
        // El usuario canceló o algo falló sin excepción
        setStatus('unauthenticated');
        return;
      }

      const { accessToken } = result;

      // Obtener perfil del usuario
      const profile = await fetchGoogleUserInfo(accessToken);
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hora

      const newUser: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        access_token: accessToken,
        refresh_token: undefined,
        token_expires_at: expiresAt,
        granted_scopes: GOOGLE_OAUTH_CONFIG.scopes,
      };

      await setUser(newUser);
    } catch (err) {
      setError(`Error de autenticación: ${String(err)}`);
      setStatus('error');
    }
  };

  return {
    user,
    status,
    error,
    isAuthenticated: status === 'authenticated' && user !== null,
    isLoading: status === 'loading',
    signIn,
    signOut,
    clearError: () => setError(null),
  };
}
