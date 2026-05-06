/**
 * @file googleAuth.ts
 * @layer infrastructure/auth
 * @description Google OAuth usando una página de redirección en GitHub Pages.
 *
 * FLUJO:
 * 1. La app abre el navegador con la URL de Google OAuth
 *    - redirect_uri = https://sergios1312.github.io/appmovil/redirect.html
 *    - state = exp://192.168.x.x:8081 (URL de retorno a Expo Go)
 * 2. El usuario se autentica en Google
 * 3. Google redirige a la página de GitHub Pages con el token en el hash
 * 4. La página lee el token y redirige a exp://... (que Expo Go intercepta)
 * 5. WebBrowser.openAuthSessionAsync captura la URL de retorno
 * 6. La app parsea el token de la URL
 *
 * CONFIGURACIÓN REQUERIDA en Google Cloud Console:
 * 1. Client ID tipo "Web application"
 * 2. En "Authorized redirect URIs":
 *    https://sergios1312.github.io/appmovil/redirect.html
 * 3. APIs habilitadas: Google Tasks API, Google Calendar API
 * 4. Pantalla de consentimiento: usuario de prueba agregado
 *
 * CONFIGURACIÓN REQUERIDA en GitHub:
 * 1. En el repo sergios1312/appmovil, ir a Settings > Pages
 * 2. Source: Deploy from a branch
 * 3. Branch: master, Folder: /docs
 * 4. Guardar y esperar ~1 min a que se despliegue
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

/**
 * URL de la página de redirección hospedada en GitHub Pages.
 * ESTA es la URL que debe estar registrada en Google Cloud Console.
 */
const GITHUB_REDIRECT_URI = 'https://sergios1312.github.io/appmovil/redirect.html';

export const GOOGLE_OAUTH_CONFIG = {
  webClientId: WEB_CLIENT_ID,
  scopes: GOOGLE_SCOPES,
};

/**
 * Inicia el flujo de autenticación con Google.
 *
 * Usa una página intermedia en GitHub Pages como redirect_uri
 * que luego redirige al esquema exp:// que Expo Go puede interceptar.
 */
export async function signInWithGoogle(): Promise<{ accessToken: string } | null> {
  // La URL de retorno a Expo Go (exp://192.168.x.x:8081)
  const returnUrl = AuthSession.makeRedirectUri({ preferLocalhost: false });

  console.log('[GoogleAuth] Return URL (Expo Go):', returnUrl);
  console.log('[GoogleAuth] Redirect URI (GitHub Pages):', GITHUB_REDIRECT_URI);

  // Construir la URL de autenticación de Google
  // El parámetro "state" contiene la URL de retorno a Expo Go (codificada)
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(GOOGLE_SCOPES.join(' '))}` +
    `&state=${encodeURIComponent(returnUrl)}` +
    `&prompt=consent`;

  console.log('[GoogleAuth] Abriendo flujo OAuth...');

  try {
    // openAuthSessionAsync monitorea las navegaciones del navegador.
    // Cuando detecta una navegación a una URL que empieza con returnUrl,
    // cierra el navegador y devuelve esa URL.
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

    if (result.type === 'success' && result.url) {
      console.log('[GoogleAuth] Respuesta recibida');

      // El token puede venir como query param (desde la página de redirect)
      const url = result.url;

      // Intentar extraer de query params
      const queryString = url.split('?')[1]?.split('#')[0] ?? '';
      const queryParams = new URLSearchParams(queryString);
      let accessToken = queryParams.get('access_token');

      // También intentar del hash fragment (por si acaso)
      if (!accessToken) {
        const fragment = url.split('#')[1] ?? '';
        const hashParams = new URLSearchParams(fragment);
        accessToken = hashParams.get('access_token');
      }

      if (accessToken) {
        console.log('[GoogleAuth] ✅ Access token obtenido correctamente');
        return { accessToken };
      }

      console.error('[GoogleAuth] No se encontró access_token en la URL:', url);
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
