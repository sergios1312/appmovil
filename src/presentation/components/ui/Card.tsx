/**
 * @file Card.tsx
 * @layer presentation/components/ui
 * @description Componente Card contenedor reutilizable con variantes de elevación.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/src/utils/constants';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof SPACING;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', padding = 'md', style }: CardProps) {
  return (
    <View style={[styles.base, VARIANT_STYLES[variant], { padding: SPACING[padding] }, style]}>
      {children}
    </View>
  );
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
  },
});
