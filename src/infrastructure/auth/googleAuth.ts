/**
 * @file googleAuth.ts
 * @layer infrastructure/auth
 * @description Configuración de Google OAuth con AuthSession directo (NO el provider de Google).
 *
 * Usamos AuthSession.useAuthRequest directamente en lugar de Google.useAuthRequest
 * porque el provider de Google sobreescribe el redirectUri y genera `exp://` que Google rechaza.
 *
 * CONFIGURACIÓN REQUERIDA en Google Cloud Console:
 * 1. Client ID tipo "Web application"
 * 2. URI de redirección autorizada: https://auth.expo.io/@sergiosdok/appmovil
 * 3. APIs habilitadas: Google Tasks API, Google Calendar API
 * 4. Pantalla de consentimiento: usuario de prueba agregado
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Completa el flujo del navegador al regresar a la app
WebBrowser.maybeCompleteAuthSession();

/**
 * Scopes solicitados a Google
 */
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

/**
 * Discovery document de Google OAuth 2.0
 * Estos son los endpoints oficiales y estables de Google.
 */
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * La URI de redirección que usamos en Expo Go.
 * ESTA MISMA debe estar registrada en Google Cloud Console.
 */
const REDIRECT_URI = 'https://auth.expo.io/@sergiosdok/appmovil';

/**
 * El Web Client ID de Google Cloud Console.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const GOOGLE_OAUTH_CONFIG = {
  webClientId: WEB_CLIENT_ID,
  scopes: GOOGLE_SCOPES,
  redirectUri: REDIRECT_URI,
};

/**
 * Hook de React para el flujo OAuth de Google.
 * Usa AuthSession.useAuthRequest DIRECTAMENTE para tener control total del redirectUri.
 */
export function useGoogleAuth() {
  return AuthSession.useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: GOOGLE_SCOPES,
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    discovery
  );
}

/**
 * Obtiene información del perfil del usuario desde la API de Google
 */
export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo perfil de Google: ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  }>;
}
