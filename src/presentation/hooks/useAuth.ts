/**
 * @file useAuth.ts
 * @layer presentation/hooks
 * @description Hook de autenticación con Google OAuth para componentes de React.
 */

import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '@/presentation/store/authStore';
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
      // AuthSession.useAuthRequest con ResponseType.Token devuelve el token
      // directamente en response.params (implicit flow)
      const accessToken =
        response.authentication?.accessToken ??
        response.params?.access_token;

      if (accessToken) {
        handleOAuthSuccess(accessToken);
      } else {
        setError('No se recibió access token de Google');
        setStatus('error');
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Error en autenticación de Google');
      setStatus('error');
    }
  }, [response]);

  const handleOAuthSuccess = async (accessToken: string) => {
    setStatus('loading');
    try {
      const profile = await fetchGoogleUserInfo(accessToken);

      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hora por defecto

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
