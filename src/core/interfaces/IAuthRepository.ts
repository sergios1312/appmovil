/**
 * @file IAuthRepository.ts
 * @layer core/interfaces
 * @description Contrato abstracto para autenticación Google OAuth.
 */

import { User, OAuthResult } from '@/src/core/entities/User';

export interface IAuthRepository {
  /**
   * Inicia el flujo de Google OAuth.
   * Solicita scopes de Calendar y Tasks.
   */
  signInWithGoogle(): Promise<OAuthResult>;

  /**
   * Cierra sesión y limpia tokens locales
   */
  signOut(): Promise<void>;

  /**
   * Restaura la sesión desde almacenamiento local (app restart)
   */
  restoreSession(): Promise<User | null>;

  /**
   * Refresca el access token usando el refresh token
   */
  refreshToken(): Promise<string | null>;

  /**
   * Verifica si el token actual es válido
   */
  isTokenValid(): boolean;
}
