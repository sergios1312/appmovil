/**
 * @file FloatingActionButton.tsx
 * @description FAB cyberpunk con doble glow pulsante (cyan + magenta) y bordes neón.
 */

import { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '@/utils/constants';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
}: FloatingActionButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOuter = useRef(new Animated.Value(0.35)).current;
  const glowInner = useRef(new Animated.Value(0.7)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse del anillo exterior
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Glow exterior parpadeante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOuter, { toValue: 0.7, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowOuter, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Glow interior contrastado
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowInner, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(glowInner, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Rotación lenta del anillo decorativo
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Anillo exterior magenta pulsante */}
      <Animated.View
        style={[
          styles.outerRing,
          { opacity: glowOuter, transform: [{ scale: pulseAnim }] },
        ]}
      />

      {/* Anillo rotatorio decorativo */}
      <Animated.View
        style={[
          styles.rotatingRing,
          { transform: [{ rotate: rotation }] },
        ]}
      >
        <View style={[styles.tickMark, styles.tickTop]} />
        <View style={[styles.tickMark, styles.tickRight]} />
        <View style={[styles.tickMark, styles.tickBottom]} />
        <View style={[styles.tickMark, styles.tickLeft]} />
      </Animated.View>

      {/* Botón principal */}
      <Animated.View style={{ opacity: glowInner }}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={onPress}
        >
          <View style={styles.innerCore}>
            <Ionicons name={icon} size={28} color={COLORS.background} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xxl + 60,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: COLORS.magenta,
    backgroundColor: COLORS.magentaDim,
    ...SHADOWS.glowMagenta,
  },
  rotatingRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: `${COLORS.primary}50`,
    borderStyle: 'dashed',
  },
  tickMark: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  tickTop:    { top: -2, left: '50%', marginLeft: -2 },
  tickRight:  { right: -2, top: '50%', marginTop: -2 },
  tickBottom: { bottom: -2, left: '50%', marginLeft: -2 },
  tickLeft:   { left: -2, top: '50%', marginTop: -2 },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF40',
    ...SHADOWS.glowCyan,
  },
  innerCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
});
