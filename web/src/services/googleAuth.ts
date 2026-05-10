/**
 * @file googleAuth.ts — Google OAuth for Web
 * Uses the standard OAuth 2.0 implicit flow via popup window.
 */

const WEB_CLIENT_ID = '940688398410-v5slp9k27hg6fbasqtsgnoksbvjh8j59.apps.googleusercontent.com';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

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

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          resolve(null);
          return;
        }

        const url = popup.location.href;
        if (url.startsWith(redirectUri)) {
          clearInterval(interval);
          const fragment = url.split('#')[1] ?? '';
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          popup.close();

          if (accessToken) {
            resolve({ accessToken });
          } else {
            resolve(null);
          }
        }
      } catch {
        // Cross-origin — popup still on Google's domain, keep waiting
      }
    }, 200);
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
