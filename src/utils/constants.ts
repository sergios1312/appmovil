/**
 * @file constants.ts
 * @layer utils
 * @description Design tokens centralizados del sistema de diseño.
 * Modificar aquí para rediseñar toda la app sin tocar componentes.
 */

// ─── Paleta de colores (tema oscuro) ──────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  background:   '#0F1117',  // Fondo principal
  surface:      '#1A1D27',  // Cards y superficies elevadas
  surfaceHigh:  '#222636',  // Superficies más elevadas

  // Bordes
  border:       '#2A2D3E',  // Borde estándar
  borderLight:  '#353849',  // Borde claro

  // Primario (violeta/azul eléctrico)
  primary:      '#6C63FF',  // Color de acción principal
  primaryDim:   '#6C63FF30', // Versión translúcida

  // Texto
  textPrimary:  '#F0F0F8',  // Texto principal
  textSecondary:'#8B8FA8',  // Texto secundario
  textMuted:    '#4E5166',  // Texto muy tenue

  // Estados y prioridades
  success:      '#4ADE80',  // Completado
  danger:       '#F87171',  // Error / vencido
  warning:      '#FBBF24',  // Advertencia
  urgent:       '#F87171',  // Tarea urgente

  // Prioridades de tarea
  priorityLow:    '#60A5FA', // Azul - baja
  priorityMedium: '#FBBF24', // Amarillo - media
  priorityHigh:   '#FB923C', // Naranja - alta
  priorityUrgent: '#F87171', // Rojo - urgente
} as const;

// ─── Tipografía ───────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,
} as const;

// ─── Espaciado ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   24,
  xxxl:  40,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

// ─── Constantes de la app ─────────────────────────────────────────────────────
export const APP_CONFIG = {
  name:        'TaskFlow',
  version:     '1.0.0',
  maxSubtaskDepth: 3,         // Máximo de niveles de anidamiento
  syncIntervalMs: 300_000,    // Sincronizar cada 5 minutos
} as const;

// ─── Constantes de API ────────────────────────────────────────────────────────
export const API_URLS = {
  googleCalendar: 'https://www.googleapis.com/calendar/v3',
  googleTasks:    'https://tasks.googleapis.com/tasks/v1',
  googleUserInfo: 'https://www.googleapis.com/userinfo/v2/me',
} as const;
