/**
 * @file Button.tsx
 * @description Botón cyberpunk con marco HUD, bordes neón y glow.
 * Variantes: primary (cyan), secondary (outlined), danger (red), success (green-neon),
 *            magenta (cyberpunk), gold (xp), ghost (transparente).
 */

import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'magenta' | 'gold' | 'ghost';
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

interface VariantStyle {
  bg: string;
  text: string;
  border: string;
  glowColor: string;
  shadow: ViewStyle;
}

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  primary:   { bg: COLORS.primaryDim,   text: COLORS.primary,   border: COLORS.primary,   glowColor: COLORS.primary,   shadow: SHADOWS.glowCyan },
  secondary: { bg: 'transparent',       text: COLORS.textPrimary, border: COLORS.borderLight, glowColor: COLORS.borderLight, shadow: {} as ViewStyle },
  danger:    { bg: COLORS.accentDim,    text: COLORS.accent,    border: COLORS.accent,    glowColor: COLORS.accent,    shadow: SHADOWS.glowRed },
  success:   { bg: COLORS.secondaryDim, text: COLORS.secondary, border: COLORS.secondary, glowColor: COLORS.secondary, shadow: SHADOWS.glowGreen },
  magenta:   { bg: COLORS.magentaDim,   text: COLORS.magenta,   border: COLORS.magenta,   glowColor: COLORS.magenta,   shadow: SHADOWS.glowMagenta },
  gold:      { bg: COLORS.goldDim,      text: COLORS.gold,      border: COLORS.gold,      glowColor: COLORS.gold,      shadow: SHADOWS.glowGold },
  ghost:     { bg: 'transparent',       text: COLORS.textSecondary, border: 'transparent', glowColor: 'transparent', shadow: {} as ViewStyle },
};

const SIZE_STYLES: Record<ButtonSize, { h: number; px: number; fontSize: number; iconSize: number }> = {
  sm: { h: 32, px: 14, fontSize: TYPOGRAPHY.sm, iconSize: 14 },
  md: { h: 44, px: 18, fontSize: TYPOGRAPHY.md, iconSize: 18 },
  lg: { h: 52, px: 26, fontSize: TYPOGRAPHY.lg, iconSize: 20 },
};

const CORNER_SIZE = 8;
const CORNER_THICKNESS = 2;

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
  const isGhost = variant === 'ghost';

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, disabled && styles.disabled]}>
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

      {/* Esquinas HUD neón – sólo si no es ghost */}
      {!isGhost && (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.topLeft,
              { width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: v.glowColor },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.bottomRight,
              { width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: v.glowColor },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  corner: {
    position: 'absolute',
  },
  topLeft: { top: -2, left: -2 },
  bottomRight: { bottom: -2, right: -2 },
});
