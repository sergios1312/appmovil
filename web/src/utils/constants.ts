/**
 * @file constants.ts — Design tokens centralizados (compartido con la app móvil)
 */

export const COLORS = {
  background:   '#0F1117',
  surface:      '#1A1D27',
  surfaceHigh:  '#222636',
  border:       '#2A2D3E',
  borderLight:  '#353849',
  primary:      '#6C63FF',
  primaryDim:   '#6C63FF30',
  textPrimary:  '#F0F0F8',
  textSecondary:'#8B8FA8',
  textMuted:    '#4E5166',
  success:      '#4ADE80',
  danger:       '#F87171',
  warning:      '#FBBF24',
  urgent:       '#F87171',
  priorityLow:    '#60A5FA',
  priorityMedium: '#FBBF24',
  priorityHigh:   '#FB923C',
  priorityUrgent: '#F87171',
} as const;

export const APP_CONFIG = {
  name:        'TaskFlow',
  version:     '1.0.0',
  maxSubtaskDepth: 3,
  syncIntervalMs: 300_000,
} as const;
