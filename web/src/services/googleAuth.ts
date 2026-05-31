/**
 * @file googleAuth.ts — Google OAuth para Web (implicit flow vía popup + postMessage).
 *
 * El popup redirige a /auth/callback (AuthCallback), que envía el access_token a
 * esta ventana mediante window.postMessage y se cierra. Antes se leía
 * popup.location.href en un intervalo, lo cual es frágil por cross-origin.
 */

const WEB_CLIENT_ID = '940688398410-v5slp9k27hg6fbasqtsgnoksbvjh8j59.apps.googleusercontent.com';

// La web solo necesita identidad (la integración con Calendar/Tasks de Google se
// retiró al migrar a Supabase). Pedir menos scopes = menos fricción en el consent.
const GOOGLE_SCOPES = ['openid', 'profile', 'email'];

export async function signInWithGoogleWeb(): Promise<{ accessToken: string } | null> {
  return new Promise((resolve) => {
    const redirectUri = window.location.origin + '/auth/callback';

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(GOOGLE_SCOPES.join(' '))}` +
      `&prompt=consent`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      resolve(null);
      return;
    }

    let settled = false;

    const finish = (result: { accessToken: string } | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(interval);
      try {
        popup.close();
      } catch {
        /* noop */
      }
      resolve(result);
    };

    // AuthCallback (dentro del popup) envía el token por postMessage.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'google-auth-token') return;
      const token = event.data.accessToken as string | null;
      finish(token ? { accessToken: token } : null);
    };
    window.addEventListener('message', onMessage);

    // Respaldo: si el usuario cierra el popup, resolvemos null (con un pequeño
    // margen por si hay un postMessage en vuelo que aún no se procesó).
    const interval = setInterval(() => {
      if (popup.closed) {
        setTimeout(() => finish(null), 400);
      }
    }, 500);
  });
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Error obteniendo perfil de Google: ${response.status}`);

  return response.json() as Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  }>;
}
