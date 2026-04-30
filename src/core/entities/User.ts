/**
 * @file User.ts
 * @layer core/entities
 * @description Entidad de dominio pura para el Usuario autenticado.
 * Contiene los datos mínimos del perfil de Google OAuth.
 */

export interface User {
  /** ID único de Google (sub del JWT) */
  id: string;

  /** Email de la cuenta de Google */
  email: string;

  /** Nombre completo */
  name: string;

  /** URL del avatar de Google */
  avatar_url?: string;

  /** Access token de Google OAuth (para llamadas a API) */
  access_token: string;

  /** Refresh token para renovar el access token */
  refresh_token?: string;

  /** Fecha de expiración del access token (ISO 8601) */
  token_expires_at: string;

  /** Scopes autorizados por el usuario */
  granted_scopes: string[];
}

/**
 * Estado de autenticación
 */
export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated' | 'error';

/**
 * Resultado de una operación OAuth
 */
export interface OAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
