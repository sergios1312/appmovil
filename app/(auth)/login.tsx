/**
 * @file (auth)/login.tsx
 * @description Pantalla de login con Google OAuth.
 * Diseño minimalista premium con glassmorphism.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/presentation/hooks/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

export default function LoginScreen() {
  const { signIn, isLoading, error, clearError } = useAuth();

  const handleGoogleSignIn = async () => {
    clearError();
    await signIn();
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error de autenticación', error, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo con gradiente visual */}
      <View style={styles.backgroundAccent} />

      <View style={styles.content}>
        {/* Logo / Branding */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚔️</Text>
          </View>
          <Text style={styles.appName}>QuestList</Text>
          <Text style={styles.tagline}>Convierte tus tareas en misiones</Text>
        </View>

        {/* Features preview */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Botón de login */}
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} size="small" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al continuar, aceptas que la app acceda a tu{'\n'}
            Google Calendar y Google Tasks para sincronización.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '🗡️', text: 'Misiones con XP y niveles' },
  { icon: '📅', text: 'Sincronizado con Google Calendar' },
  { icon: '⚡', text: 'Progresión semanal y logros' },
  { icon: '🔀', text: 'Sub-misiones organizadas' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundAccent: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.primaryDim,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.glowCyan,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: TYPOGRAPHY.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  authContainer: {
    gap: SPACING.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.glowCyan,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  googleButtonText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
