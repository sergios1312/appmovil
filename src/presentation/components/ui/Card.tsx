/**
 * @file Card.tsx
 * @description Panel/contenedor estilo HUD – Quest UI.
 * Inspirado en paneles cyberpunk con bordes sutiles y glow opcional.
 */

import { View, StyleSheet, type ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

type CardVariant = 'default' | 'glow' | 'accent' | 'danger' | 'success';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  style,
  noPadding = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {/* Top accent line for glow variant */}
      {variant === 'glow' && <View style={styles.topAccent} />}
      {variant === 'accent' && <View style={[styles.topAccent, { backgroundColor: COLORS.primary }]} />}
      {variant === 'danger' && <View style={[styles.topAccent, { backgroundColor: COLORS.accent }]} />}
      {variant === 'success' && <View style={[styles.topAccent, { backgroundColor: COLORS.secondary }]} />}
      {children}
    </View>
  );
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    borderColor: COLORS.border,
  },
  glow: {
    borderColor: COLORS.borderGlow,
    ...SHADOWS.glowCyan,
  },
  accent: {
    borderColor: `${COLORS.primary}40`,
    backgroundColor: COLORS.primaryDim,
  },
  danger: {
    borderColor: `${COLORS.accent}40`,
    backgroundColor: COLORS.accentDim,
  },
  success: {
    borderColor: `${COLORS.secondary}40`,
    backgroundColor: COLORS.secondaryDim,
  },
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.borderGlow,
  },
});
