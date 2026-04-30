/**
 * @file dateHelpers.ts
 * @layer utils
 * @description Utilidades de fechas para la app.
 * Usa date-fns internamente (no exponer la dependencia a otras capas).
 */

import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  formatDistanceToNow,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha de forma amigable para el header
 * Ej: "Martes, 29 de abril"
 */
export function formatDateFriendly(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
}

/**
 * Formatea la fecha de vencimiento de una tarea de forma contextual
 * Ej: "Hoy", "Mañana", "Ayer", "15 abr", "hace 2 días"
 */
export function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isYesterday(date)) return 'Ayer';

  // Si vence en menos de 7 días o venció recientemente
  const diffDays = Math.abs(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (diffDays <= 7) {
    return formatDistanceToNow(date, { locale: es, addSuffix: true });
  }

  return format(date, "d 'de' MMM", { locale: es });
}

/**
 * Verifica si una fecha ISO está vencida (en el pasado)
 */
export function isOverdue(isoDate: string): boolean {
  return isPast(new Date(isoDate));
}

/**
 * Retorna el inicio del día de hoy en ISO 8601
 */
export function getTodayStartISO(): string {
  return startOfDay(new Date()).toISOString();
}

/**
 * Retorna el fin del día de hoy en ISO 8601
 */
export function getTodayEndISO(): string {
  return endOfDay(new Date()).toISOString();
}

/**
 * Convierte una fecha a formato ISO 8601 con timezone
 */
export function toISO(date: Date): string {
  return date.toISOString();
}

/**
 * Formatea para mostrar en un label de tarea (corto)
 * Ej: "15 abr 2024"
 */
export function formatShort(isoDate: string): string {
  return format(new Date(isoDate), "d MMM yyyy", { locale: es });
}
