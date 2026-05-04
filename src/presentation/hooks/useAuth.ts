/**
 * @file useAuth.ts
 * @layer presentation/hooks
 * @description Hook de autenticación con Google OAuth para componentes de React.
 */

import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '@/infrastructure/store/authStore';
import { useGoogleAuth, fetchGoogleUserInfo, GOOGLE_OAUTH_CONFIG } from '@/infrastructure/auth/googleAuth';
import { User } from '@/core/entities/User';

export function useAuth() {
  const { user, status, error, setUser, signOut, restoreSession, setStatus, setError } =
    useAuthStore();

  const [request, response, promptAsync] = useGoogleAuth();

  // Restaurar sesión al iniciar la app
  useEffect(() => {
    restoreSession();
  }, []);

  // Manejar respuesta del flujo OAuth
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleOAuthSuccess(authentication);
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Error en autenticación de Google');
      setStatus('error');
    }
  }, [response]);

  const handleOAuthSuccess = async (authentication: AuthSession.TokenResponse) => {
    setStatus('loading');
    try {
      const profile = await fetchGoogleUserInfo(authentication.accessToken);

      const expiresAt = authentication.expiresIn
        ? new Date(Date.now() + authentication.expiresIn * 1000).toISOString()
        : new Date(Date.now() + 3600000).toISOString(); // 1 hora por defecto

      const newUser: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        access_token: authentication.accessToken,
        refresh_token: authentication.refreshToken ?? undefined,
        token_expires_at: expiresAt,
        granted_scopes: GOOGLE_OAUTH_CONFIG.scopes,
      };

      await setUser(newUser);
    } catch (err) {
      setError(`Error obteniendo perfil: ${String(err)}`);
      setStatus('error');
    }
  };

  return {
    user,
    status,
    error,
    isAuthenticated: status === 'authenticated' && user !== null,
    isLoading: status === 'loading',
    signIn: () => promptAsync(),
    signOut,
    clearError: () => setError(null),
  };
}
