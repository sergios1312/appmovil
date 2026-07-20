/**
 * @file constants.ts
 * @layer utils
 * @description Design tokens centralizados del sistema de diseño.
 * Estética: Fusión Cyberpunk + Quest RPG + Solarpunk
 * Modificar aquí para rediseñar toda la app sin tocar componentes.
 */

// ─── Paleta de colores (tema oscuro) ──────────────────────────────────────────
// Alineada con la web (web/src/index.css) para paridad visual entre la app nativa
// y la web en celular. Cian #00E5FF como acento de marca.
export const COLORS = {
  // Backgrounds
  background:    '#0B0E14',   // Fondo principal (= --bg web)
  backgroundAlt: '#0B0E14',   // Fondo alterno
  surface:       '#111827',   // Paneles / cards (= --surface web)
  surfaceHigh:   '#1A2332',   // Superficies elevadas (= --surface-high web)
  surfaceBright: '#222E3F',   // Inputs / hover (= --surface-bright web)

  // Bordes
  border:        '#1E2A3A',   // Borde estándar (= --border web)
  borderLight:   '#2A3A4E',   // Borde claro (= --border-light web)
  borderGlow:    '#00E5FF40', // Borde con glow cyan
  borderNeon:    '#00E5FF',   // Borde neón fuerte

  // Primario – Cyan (acento de marca, = --primary web)
  primary:       '#00E5FF',
  primaryDark:   '#00B8D4',
  primaryDim:    '#00E5FF1A', // Background translúcido
  primaryGlow:   '#00E5FF80', // Para glows

  // Secundario – Verde (= --secondary/--success web)
  secondary:     '#4ADE80',
  secondaryDim:  '#4ADE8020',
  secondaryGlow: '#4ADE8080',

  // Magenta / Púrpura – acentos extra del HUD (la web usa violeta #a78bfa en marca)
  magenta:       '#A78BFA',
  magentaDim:    '#A78BFA20',
  magentaGlow:   '#A78BFA80',
  purple:        '#A78BFA',
  purpleDim:     '#A78BFA20',
  purpleGlow:    '#A78BFA80',

  // Acento – Rojo (= --accent/--danger web)
  accent:        '#FF3B3B',
  accentDim:     '#FF3B3B20',

  // Gold – Recompensas / XP (= --gold web)
  gold:          '#FFD700',
  goldDim:       '#FFD70020',

  // Texto (= web)
  textPrimary:   '#E8ECF4',
  textSecondary: '#7A8599',
  textMuted:     '#3E4A5C',
  textInverse:   '#0B0E14',
  textNeon:      '#00E5FF',

  // Estados
  success:       '#4ADE80',
  danger:        '#FF3B3B',
  warning:       '#FBBF24',
  info:          '#60A5FA',

  // Prioridades (= web)
  priorityLow:    '#60A5FA',  // Azul – fácil
  priorityMedium: '#FBBF24',  // Ámbar – media
  priorityHigh:   '#FB923C',  // Naranja – difícil
  priorityUrgent: '#FF3B3B',  // Rojo – crítica

  // Overlay / modals
  overlay:       'rgba(0, 0, 0, 0.78)',
  scrim:         'rgba(11, 14, 20, 0.92)',
  grid:          '#0E1A2D',
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
    shadowOpacity: 0.65,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     10,
  },
  /** Glow cyan suave */
  glowCyanSoft: {
    shadowColor:   '#00E5FF',
    shadowOpacity: 0.30,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     5,
  },
  /** Glow verde neón para éxitos */
  glowGreen: {
    shadowColor:   '#4ADE80',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow rojo neón para urgentes */
  glowRed: {
    shadowColor:   '#FF3B3B',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow magenta cyberpunk */
  glowMagenta: {
    shadowColor:   '#A78BFA',
    shadowOpacity: 0.60,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     9,
  },
  /** Glow púrpura HUD */
  glowPurple: {
    shadowColor:   '#A78BFA',
    shadowOpacity: 0.55,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     8,
  },
  /** Glow dorado para recompensas */
  glowGold: {
    shadowColor:   '#FFD700',
    shadowOpacity: 0.50,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     7,
  },
  /** Sombra sutil para cards estándar */
  card: {
    shadowColor:   '#00E5FF',
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
