/**
 * @file HudFrame.tsx
 * @layer presentation/components/ui
 * @description Marco HUD cyberpunk con esquinas L recortadas (estilo videojuego).
 * Envuelve contenido con líneas neón en las 4 esquinas. Soporta colores configurables
 * y opcionalmente una franja superior tipo "panel header".
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, RADIUS } from '@/utils/constants';

interface HudFrameProps {
  children: React.ReactNode;
  /** Color de las esquinas neón. Default: cyan. */
  color?: string;
  /** Tamaño de la "L" en cada esquina (px). */
  cornerSize?: number;
  /** Grosor de la línea de la esquina (px). */
  cornerThickness?: number;
  /** Estilo del contenedor exterior. */
  style?: StyleProp<ViewStyle>;
  /** Estilo del contenedor interior (donde van los hijos). */
  innerStyle?: StyleProp<ViewStyle>;
  /** Mostrar las 4 esquinas o solo 2 (top-left / bottom-right). */
  variant?: 'full' | 'diagonal';
}

/**
 * Marco con esquinas en L estilo HUD cyberpunk.
 * No usa SVG (compatible con Expo Go) – usa Views absolutas.
 */
export default function HudFrame({
  children,
  color = COLORS.primary,
  cornerSize = 14,
  cornerThickness = 2,
  style,
  innerStyle,
  variant = 'full',
}: HudFrameProps) {
  const showAll = variant === 'full';

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.inner, innerStyle]}>{children}</View>

      {/* Top-left corner */}
      <View
        pointerEvents="none"
        style={[
          styles.corner,
          styles.topLeft,
          {
            width: cornerSize,
            height: cornerSize,
            borderTopWidth: cornerThickness,
            borderLeftWidth: cornerThickness,
            borderColor: color,
          },
        ]}
      />

      {/* Top-right */}
      {showAll && (
        <View
          pointerEvents="none"
          style={[
            styles.corner,
            styles.topRight,
            {
              width: cornerSize,
              height: cornerSize,
              borderTopWidth: cornerThickness,
              borderRightWidth: cornerThickness,
              borderColor: color,
            },
          ]}
        />
      )}

      {/* Bottom-left */}
      {showAll && (
        <View
          pointerEvents="none"
          style={[
            styles.corner,
            styles.bottomLeft,
            {
              width: cornerSize,
              height: cornerSize,
              borderBottomWidth: cornerThickness,
              borderLeftWidth: cornerThickness,
              borderColor: color,
            },
          ]}
        />
      )}

      {/* Bottom-right corner */}
      <View
        pointerEvents="none"
        style={[
          styles.corner,
          styles.bottomRight,
          {
            width: cornerSize,
            height: cornerSize,
            borderBottomWidth: cornerThickness,
            borderRightWidth: cornerThickness,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  inner: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
  },
  topLeft: { top: -1, left: -1 },
  topRight: { top: -1, right: -1 },
  bottomLeft: { bottom: -1, left: -1 },
  bottomRight: { bottom: -1, right: -1 },
});
