/**
 * @file constants.ts
 * @layer utils
 * @description Design tokens centralizados del sistema de diseño.
 * Estética: Fusión Cyberpunk + Quest RPG + Solarpunk
 * Modificar aquí para rediseñar toda la app sin tocar componentes.
 */

// ─── Paleta de colores (tema oscuro – Quest UI) ───────────────────────────────
export const COLORS = {
  // Backgrounds
  background:    '#0B0E14',   // Deep space – fondo principal
  surface:       '#111827',   // Paneles / cards
  surfaceHigh:   '#1A2332',   // Superficies elevadas
  surfaceBright: '#222E3F',   // Hover states / inputs

  // Bordes
  border:        '#1E2A3A',   // Borde estándar sutil
  borderLight:   '#2A3A4E',   // Borde claro / separadores
  borderGlow:    '#00E5FF40', // Borde con glow cyan

  // Primario – Cyan Neón (cyberpunk)
  primary:       '#00E5FF',   // Acción principal
  primaryDark:   '#00B8D4',   // Hover del primario
  primaryDim:    '#00E5FF18', // Background translúcido

  // Secundario – Esmeralda (solarpunk)
  secondary:     '#4ADE80',   // Éxito / completado / naturaleza
  secondaryDim:  '#4ADE8020', // Fondo translúcido verde

  // Acento – Rojo Quest
  accent:        '#FF3B3B',   // Urgente / danger / quest crítica
  accentDim:     '#FF3B3B20', // Fondo translúcido rojo

  // Gold – Recompensas / XP
  gold:          '#FFD700',   // XP, monedas, logros
  goldDim:       '#FFD70020', // Fondo gold translúcido

  // Texto
  textPrimary:   '#E8ECF4',   // Texto principal brillante
  textSecondary: '#7A8599',   // Texto secundario
  textMuted:     '#3E4A5C',   // Texto muy tenue
  textInverse:   '#0B0E14',   // Texto sobre fondo claro

  // Estados y prioridades
  success:       '#4ADE80',   // Completado
  danger:        '#FF3B3B',   // Error / vencido
  warning:       '#FBBF24',   // Advertencia / media
  info:          '#60A5FA',   // Informativo

  // Prioridades de tarea (quest difficulty)
  priorityLow:    '#60A5FA',  // Azul – fácil
  priorityMedium: '#FBBF24',  // Amarillo – media
  priorityHigh:   '#FB923C',  // Naranja – difícil
  priorityUrgent: '#FF3B3B',  // Rojo – crítica

  // Overlay / modals
  overlay:       'rgba(0, 0, 0, 0.7)',
  scrim:         'rgba(11, 14, 20, 0.85)',
} as const;

// ─── Tipografía ───────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  xs:    10,
  sm:    12,
  md:    14,
  lg:    16,
  xl:    18,
  xxl:   22,
  xxxl:  28,
  hero:  34,   // Títulos de pantalla grandes
} as const;

// ─── Espaciado ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   24,
  xxxl:  32,
  huge:  48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  xxl:  28,
  full: 999,
} as const;

// ─── Sombras / Glow Effects ──────────────────────────────────────────────────
export const SHADOWS = {
  /** Glow cyan para botones primarios y elementos activos */
  glowCyan: {
    shadowColor:   '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow verde para éxitos y completados */
  glowGreen: {
    shadowColor:   '#4ADE80',
    shadowOpacity: 0.30,
    shadowRadius:  14,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     6,
  },
  /** Glow rojo para urgentes */
  glowRed: {
    shadowColor:   '#FF3B3B',
    shadowOpacity: 0.30,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     6,
  },
  /** Glow dorado para recompensas */
  glowGold: {
    shadowColor:   '#FFD700',
    shadowOpacity: 0.30,
    shadowRadius:  14,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     6,
  },
  /** Sombra sutil para cards estándar */
  card: {
    shadowColor:   '#000',
    shadowOpacity: 0.25,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     4,
  },
  /** Sombra elevada para modales y popups */
  elevated: {
    shadowColor:   '#000',
    shadowOpacity: 0.45,
    shadowRadius:  20,
    shadowOffset:  { width: 0, height: 8 },
    elevation:     12,
  },
} as const;

// ─── Constantes de la app ─────────────────────────────────────────────────────
export const APP_CONFIG = {
  name:            'QuestList',
  version:         '1.0.0',
  maxSubtaskDepth: 3,
  syncIntervalMs:  300_000,
} as const;

// ─── Constantes de API ────────────────────────────────────────────────────────
export const API_URLS = {
  googleCalendar: 'https://www.googleapis.com/calendar/v3',
  googleTasks:    'https://tasks.googleapis.com/tasks/v1',
  googleUserInfo: 'https://www.googleapis.com/userinfo/v2/me',
} as const;
