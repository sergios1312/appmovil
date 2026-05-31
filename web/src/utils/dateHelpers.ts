/**
 * @file dateHelpers.ts — Utilidades de fechas (compartido con la app móvil)
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

export function formatDateFriendly(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
}

export function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isYesterday(date)) return 'Ayer';

  const diffDays = Math.abs(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (diffDays <= 7) {
    return formatDistanceToNow(date, { locale: es, addSuffix: true });
  }

  return format(date, "d 'de' MMM", { locale: es });
}

export function isOverdue(isoDate: string): boolean {
  return isPast(new Date(isoDate));
}

export function getTodayStartISO(): string {
  return startOfDay(new Date()).toISOString();
}

export function getTodayEndISO(): string {
  return endOfDay(new Date()).toISOString();
}

export function formatShort(isoDate: string): string {
  return format(new Date(isoDate), "d MMM yyyy", { locale: es });
}

// ─── Convención canónica de fechas (HORA LOCAL, sin UTC) ──────────────────────
// Toda la app trata el "día" de una tarea en hora local. Guardamos due_date como
// ISO sin zona (YYYY-MM-DDTHH:mm:ss) para que `due_date.startsWith(localDayKey())`
// sea consistente en filtros, calendario y recurrencia. NO usar toISOString() para
// derivar el día de una tarea: convierte a UTC y desplaza el día cerca de medianoche.

/** Clave de día local en formato YYYY-MM-DD (en-CA produce ese orden). */
export function localDayKey(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA');
}

/** Extrae la clave de día (YYYY-MM-DD) de un due_date almacenado. */
export function dayKeyOf(isoDate: string): string {
  return isoDate.split('T')[0];
}

/**
 * Convierte el value de un <input type="datetime-local"> ("2026-05-30T20:00")
 * a ISO local sin zona con segundos ("2026-05-30T20:00:00"). Preserva la hora
 * local elegida por el usuario en lugar de desplazarla a UTC.
 */
export function dateTimeLocalToISO(value: string): string {
  if (!value) return value;
  // "YYYY-MM-DDTHH:mm" (16) → añade segundos; si ya trae segundos, se deja igual.
  return value.length === 16 ? `${value}:00` : value;
}
