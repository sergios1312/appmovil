/**
 * @file services/googleAuth.ts
 * @description Auth service usado por la pantalla de Calendar.
 * Usa AuthSession directamente (no el provider de Google).
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = 'https://auth.expo.io/@sergiosdok/appmovil';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
];

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

export function useGoogleLoginRequest() {
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

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google profile request failed (${response.status})`);
  }

  return (await response.json()) as GoogleProfile;
}
