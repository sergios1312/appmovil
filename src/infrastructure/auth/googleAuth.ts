/**
 * @file googleAuth.ts
 * @layer infrastructure/auth
 * @description Google OAuth usando WebBrowser.openAuthSessionAsync directamente.
 *
 * Este enfoque NO depende del proxy de Expo (auth.expo.io) que está deprecado.
 * En su lugar, usa el flujo implícito de OAuth y captura el token directamente
 * del fragmento de la URL de redirección.
 *
 * CONFIGURACIÓN REQUERIDA en Google Cloud Console:
 * 1. Client ID tipo "Web application"
 * 2. En "Authorized JavaScript origins": https://auth.expo.io
 * 3. En "Authorized redirect URIs": https://auth.expo.io/@sergiosdok/appmovil
 * 4. APIs habilitadas: Google Tasks API, Google Calendar API
 * 5. Pantalla de consentimiento: usuario de prueba agregado
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

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

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const GOOGLE_OAUTH_CONFIG = {
  webClientId: WEB_CLIENT_ID,
  scopes: GOOGLE_SCOPES,
};

/**
 * Inicia el flujo de autenticación con Google de forma manual.
 * Abre el navegador, el usuario se autentica, y retorna el access_token.
 *
 * Usa el redirectUri nativo de Expo Go (exp://...) que AuthSession sabe interceptar.
 * Google redirige al proxy de Expo, que a su vez redirige al esquema de la app.
 *
 * Si el proxy falla, usamos un enfoque alternativo con el esquema nativo.
 */
export async function signInWithGoogle(): Promise<{ accessToken: string } | null> {
  // Generar el redirectUri que Expo Go puede interceptar
  const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: false });

  // Construir la URL de autenticación de Google manualmente
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(GOOGLE_SCOPES.join(' '))}` +
    `&prompt=consent`;

  console.log('[GoogleAuth] redirectUri:', redirectUri);
  console.log('[GoogleAuth] Abriendo flujo OAuth...');

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // El access_token viene en el fragmento (#) de la URL
      const url = result.url;
      console.log('[GoogleAuth] URL de respuesta recibida');

      // Extraer el access_token del fragmento de la URL
      const fragment = url.split('#')[1];
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');

        if (accessToken) {
          console.log('[GoogleAuth] Access token obtenido correctamente');
          return { accessToken };
        }
      }

      // Intentar extraer de query params (por si acaso)
      const queryPart = url.split('?')[1]?.split('#')[0];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const accessToken = params.get('access_token');
        if (accessToken) {
          console.log('[GoogleAuth] Access token obtenido de query params');
          return { accessToken };
        }
      }

      console.error('[GoogleAuth] No se encontró access_token en la URL');
      return null;
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[GoogleAuth] Flujo cancelado por el usuario');
      return null;
    }

    console.error('[GoogleAuth] Resultado inesperado:', result.type);
    return null;
  } catch (error) {
    console.error('[GoogleAuth] Error en el flujo OAuth:', error);
    throw error;
  }
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
