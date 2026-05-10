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
