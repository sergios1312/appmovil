/**
 * @file HexAvatar.tsx
 * @layer presentation/components/ui
 * @description Avatar hexagonal cyberpunk con borde neón.
 * Truco: dos rectángulos rotados 30°/-30° superpuestos crean efecto hex sin SVG.
 * Para look HUD usamos un rombo (cuadrado rotado 45°) con un círculo interior.
 */

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '@/utils/constants';

interface HexAvatarProps {
  /** Iniciales (1-2 letras). Si se omite, muestra icono. */
  initials?: string;
  /** Tamaño en px (lado del cuadrado base). */
  size?: number;
  /** Color del borde neón. */
  color?: string;
  /** Icono fallback si no hay iniciales. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Estilo del contenedor. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Avatar romboidal con marco neón (estilo hexagonal aproximado sin SVG).
 */
export default function HexAvatar({
  initials,
  size = 64,
  color = COLORS.primary,
  icon = 'person',
  style,
}: HexAvatarProps) {
  const inner = size * 0.78;

  return (
    <View style={[styles.wrapper, { width: size + 8, height: size + 8 }, style]}>
      {/* Marco exterior rotado (rombo) */}
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderColor: color,
            shadowColor: color,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* Marco interior secundario */}
      <View
        style={[
          styles.frameInner,
          {
            width: size - 6,
            height: size - 6,
            borderColor: `${color}50`,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* Contenido (no rotado) */}
      <View
        style={[
          styles.content,
          {
            width: inner,
            height: inner,
            backgroundColor: COLORS.surface,
            borderColor: `${color}40`,
          },
        ]}
      >
        {initials ? (
          <Text style={[styles.initials, { color, fontSize: inner * 0.42 }]}>
            {initials.toUpperCase().slice(0, 2)}
          </Text>
        ) : (
          <Ionicons name={icon} size={inner * 0.5} color={color} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frame: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  frameInner: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  content: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '900',
    letterSpacing: 1,
  },
});
