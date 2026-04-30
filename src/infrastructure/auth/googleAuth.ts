/**
 * @file googleAuth.ts
 * @layer infrastructure/auth
 * @description Configuración de Google OAuth con expo-auth-session.
 *
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear proyecto en https://console.cloud.google.com/
 * 2. Habilitar: Google Calendar API + Google Tasks API
 * 3. Crear credencial OAuth 2.0 → tipo: Android
 *    - Package name: com.tuempresa.appmovil (debe coincidir con app.json)
 *    - SHA-1 fingerprint: obtener con `eas credentials`
 * 4. Copiar el Client ID en .env.local
 *
 * NOTA: Para Expo Managed Workflow (sin código nativo), se usa el proxy de Expo:
 * https://auth.expo.io/@tu-usuario/appmovil
 * Esto permite hacer OAuth sin necesidad de configurar el redirect URI manualmente.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Completa el flujo del navegador al regresar a la app
WebBrowser.maybeCompleteAuthSession();

/**
 * Scopes solicitados a Google:
 * - profile: nombre y foto del usuario
 * - email: correo del usuario
 * - calendar: leer/escribir eventos de Google Calendar
 * - tasks: leer/escribir tareas de Google Tasks
 */
export const GOOGLE_SCOPES = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

/**
 * IDs de cliente OAuth de Google
 * Obtener desde Google Cloud Console
 * Para Android en Expo Managed: usar el androidClientId
 */
export const GOOGLE_OAUTH_CONFIG = {
  // Reemplazar con tu Client ID de Google Cloud Console
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',

  scopes: GOOGLE_SCOPES,

  // URI de redirección para Expo Go (development):
  // https://auth.expo.io/@sergiosdok/appmovil
  // Para producción (EAS Build): se usa el scheme del app.json automáticamente
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'com.sergiosdok.appmovil',
    path: 'auth',
  }),
};

/**
 * Hook de React para el flujo OAuth de Google.
 * Usar en componentes/pantallas de login.
 *
 * Ejemplo de uso:
 * const [request, response, promptAsync] = useGoogleAuth();
 * // Al presionar login: await promptAsync();
 * // Manejar respuesta en useEffect([response])
 */
export function useGoogleAuth() {
  return Google.useAuthRequest({
    androidClientId: GOOGLE_OAUTH_CONFIG.androidClientId,
    webClientId: GOOGLE_OAUTH_CONFIG.webClientId,
    scopes: GOOGLE_SCOPES,
  });
}

/**
 * Obtiene información del perfil del usuario desde la API de Google
 * usando el access token obtenido en el flujo OAuth.
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
