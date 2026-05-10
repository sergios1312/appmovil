/**
 * @file User.ts
 * @layer core/entities
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at: string;
  granted_scopes: string[];
}

export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated' | 'error';

export interface OAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
