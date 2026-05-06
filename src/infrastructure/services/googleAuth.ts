/**
 * @file services/googleAuth.ts
 * @description Auth service usado por la pantalla de Calendar.
 * Re-exporta las funciones del módulo principal de auth.
 */

import { signInWithGoogle, fetchGoogleUserInfo } from '@/infrastructure/auth/googleAuth';

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

export { signInWithGoogle };

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
