/**
 * @file constants.ts
 * @layer utils
 * @description Design tokens centralizados del sistema de diseño.
 * Estética: Fusión Cyberpunk + Quest RPG + Solarpunk
 * Modificar aquí para rediseñar toda la app sin tocar componentes.
 */

// ─── Paleta de colores (tema oscuro – Cyberpunk Quest UI) ─────────────────────
export const COLORS = {
  // Backgrounds (más profundos, casi negro azulado)
  background:    '#05070D',   // Void – fondo principal cyberpunk
  backgroundAlt: '#080B14',   // Fondo alterno para gradient overlays
  surface:       '#0D1220',   // Paneles / cards
  surfaceHigh:   '#131A2C',   // Superficies elevadas
  surfaceBright: '#1B2540',   // Hover states / inputs

  // Bordes
  border:        '#1C2740',   // Borde estándar sutil
  borderLight:   '#2A3A5A',   // Borde claro / separadores
  borderGlow:    '#00F0FF55', // Borde con glow cyan
  borderNeon:    '#00F0FF',   // Borde neón fuerte

  // Primario – Cyan Neón (cyberpunk classic)
  primary:       '#00F0FF',   // Cyan neón eléctrico
  primaryDark:   '#00B8D4',   // Hover del primario
  primaryDim:    '#00F0FF1A', // Background translúcido
  primaryGlow:   '#00F0FF80', // Para glows medios

  // Secundario – Verde neón (matrix)
  secondary:     '#39FF14',   // Verde neón cyberpunk
  secondaryDim:  '#39FF1420', // Fondo translúcido verde
  secondaryGlow: '#39FF1480',

  // Magenta – Acento cyberpunk
  magenta:       '#FF2EC4',   // Magenta neón
  magentaDim:    '#FF2EC420', // Fondo translúcido magenta
  magentaGlow:   '#FF2EC480',

  // Púrpura – HUD secundario
  purple:        '#B829FF',   // Púrpura neón
  purpleDim:     '#B829FF20',
  purpleGlow:    '#B829FF80',

  // Acento – Rojo Quest
  accent:        '#FF3B5C',   // Urgente / danger / quest crítica
  accentDim:     '#FF3B5C20', // Fondo translúcido rojo

  // Gold – Recompensas / XP
  gold:          '#FFD53D',   // XP, monedas, logros
  goldDim:       '#FFD53D20', // Fondo gold translúcido

  // Texto
  textPrimary:   '#EAF4FF',   // Texto principal brillante
  textSecondary: '#7B8AAA',   // Texto secundario
  textMuted:     '#3A4A6A',   // Texto muy tenue
  textInverse:   '#05070D',   // Texto sobre fondo claro
  textNeon:      '#00F0FF',   // Texto neón para hilights

  // Estados y prioridades
  success:       '#39FF14',   // Completado (verde neón)
  danger:        '#FF3B5C',   // Error / vencido
  warning:       '#FBBF24',   // Advertencia / media
  info:          '#60A5FA',   // Informativo

  // Prioridades de tarea (quest difficulty) – neones puros
  priorityLow:    '#00F0FF',  // Cyan – fácil
  priorityMedium: '#FBBF24',  // Ámbar – media
  priorityHigh:   '#FF2EC4',  // Magenta – difícil
  priorityUrgent: '#FF3B5C',  // Rojo neón – crítica

  // Overlay / modals
  overlay:       'rgba(0, 0, 0, 0.78)',
  scrim:         'rgba(5, 7, 13, 0.92)',
  grid:          '#0E1A2D',   // Color del grid de circuito de fondo
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
    shadowColor:   '#00F0FF',
    shadowOpacity: 0.65,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     10,
  },
  /** Glow cyan suave */
  glowCyanSoft: {
    shadowColor:   '#00F0FF',
    shadowOpacity: 0.30,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     5,
  },
  /** Glow verde neón para éxitos */
  glowGreen: {
    shadowColor:   '#39FF14',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow rojo neón para urgentes */
  glowRed: {
    shadowColor:   '#FF3B5C',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow magenta cyberpunk */
  glowMagenta: {
    shadowColor:   '#FF2EC4',
    shadowOpacity: 0.60,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     9,
  },
  /** Glow púrpura HUD */
  glowPurple: {
    shadowColor:   '#B829FF',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow dorado para recompensas */
  glowGold: {
    shadowColor:   '#FFD53D',
    shadowOpacity: 0.50,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     7,
  },
  /** Sombra sutil para cards estándar */
  card: {
    shadowColor:   '#00F0FF',
    shadowOpacity: 0.10,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     4,
  },
  /** Sombra elevada para modales y popups */
  elevated: {
    shadowColor:   '#000',
    shadowOpacity: 0.55,
    shadowRadius:  24,
    shadowOffset:  { width: 0, height: 10 },
    elevation:     14,
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
