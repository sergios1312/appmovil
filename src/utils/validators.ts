/**
 * @file validators.ts
 * @layer utils
 * @description Schemas de validación Zod compartidos y funciones helper de validación.
 * Centraliza las reglas de validación para uso en use-cases y formularios de UI.
 */

import { z } from 'zod';

// ─── Schemas reutilizables ────────────────────────────────────────────────────

export const UUIDSchema = z.string().uuid('ID inválido');

export const ISODateSchema = z
  .string()
  .datetime({ offset: true, message: 'Fecha inválida, usar formato ISO 8601' });

export const TaskTitleSchema = z
  .string()
  .min(1, 'El título es requerido')
  .max(200, 'El título no puede superar 200 caracteres')
  .trim();

export const TaskDescriptionSchema = z
  .string()
  .max(2000, 'La descripción no puede superar 2000 caracteres')
  .trim()
  .optional();

export const TaskTagsSchema = z
  .array(z.string().min(1).max(30).trim())
  .max(10, 'Máximo 10 etiquetas')
  .optional();

// ─── Reglas de negocio ────────────────────────────────────────────────────────

/**
 * Verifica si una fecha es válida y está en el futuro
 */
export function isFutureDate(isoDate: string): boolean {
  return new Date(isoDate) > new Date();
}

/**
 * Verifica si un string es un UUID válido
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Limpia y normaliza tags (quita duplicados, trim, lowercase)
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Valida que un access token de Google no esté expirado
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}
