/**
 * @file Button.tsx
 * @description Botón reutilizable estilo Quest UI con variantes neón.
 * Variantes: primary (cyan), secondary (outlined), danger (red), success (green), gold.
 */

import { Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'gold' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border: string; shadow: ViewStyle }> = {
  primary:   { bg: COLORS.primary,   text: COLORS.textInverse, border: COLORS.primary,   shadow: SHADOWS.glowCyan },
  secondary: { bg: 'transparent',    text: COLORS.primary,     border: COLORS.primary,   shadow: {} as ViewStyle },
  danger:    { bg: COLORS.accent,    text: '#FFFFFF',          border: COLORS.accent,    shadow: SHADOWS.glowRed },
  success:   { bg: COLORS.secondary, text: COLORS.textInverse, border: COLORS.secondary, shadow: SHADOWS.glowGreen },
  gold:      { bg: COLORS.gold,      text: COLORS.textInverse, border: COLORS.gold,      shadow: SHADOWS.glowGold },
  ghost:     { bg: 'transparent',    text: COLORS.textSecondary, border: 'transparent',  shadow: {} as ViewStyle },
};

const SIZE_STYLES: Record<ButtonSize, { h: number; px: number; fontSize: number; iconSize: number }> = {
  sm: { h: 32, px: 12, fontSize: TYPOGRAPHY.sm, iconSize: 14 },
  md: { h: 42, px: 16, fontSize: TYPOGRAPHY.md, iconSize: 18 },
  lg: { h: 50, px: 24, fontSize: TYPOGRAPHY.lg, iconSize: 20 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          height: s.h,
          paddingHorizontal: s.px,
          ...(v.shadow as ViewStyle),
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon && <Ionicons name={icon} size={s.iconSize} color={v.text} />}
      <Text
        style={[
          styles.text,
          { color: v.text, fontSize: s.fontSize },
        ]}
      >
        {title}
      </Text>
      {iconRight && <Ionicons name={iconRight} size={s.iconSize} color={v.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
