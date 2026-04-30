/**
 * @file Button.tsx
 * @layer presentation/components/ui
 * @description Componente Button reutilizable con variantes y estados.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/src/utils/constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: COLORS.primary, borderWidth: 0 },
    text: { color: COLORS.background },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary },
    text: { color: COLORS.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0 },
    text: { color: COLORS.textSecondary },
  },
  danger: {
    container: { backgroundColor: COLORS.danger, borderWidth: 0 },
    text: { color: COLORS.background },
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }, text: { fontSize: TYPOGRAPHY.sm } },
  md: { container: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg }, text: { fontSize: TYPOGRAPHY.md } },
  lg: { container: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl }, text: { fontSize: TYPOGRAPHY.lg } },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text.color as string} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, variantStyle.text, sizeStyle.text]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '600' },
});
