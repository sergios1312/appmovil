/**
 * @file _layout.tsx (Root)
 * @description Layout raíz de Expo Router.
 * Maneja: fuentes, splash screen, auth gate y tema global.
 *
 * Lógica de Auth Gate:
 * - Si status === 'loading': muestra splash
 * - Si status === 'unauthenticated': redirige a /(auth)/login
 * - Si status === 'authenticated': muestra /(tabs)/
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/src/presentation/hooks/useAuth';
import { COLORS } from '@/src/utils/constants';

// Mantener el splash screen hasta que esté listo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    // Puedes agregar fuentes personalizadas aquí
    // 'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
  });

  // Ocultar splash cuando las fuentes estén cargadas
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Auth gate: redirigir según estado de autenticación
  useEffect(() => {
    if (status === 'loading') return; // Esperar a que se resuelva

    const inAuthGroup = segments[0] === '(auth)';

    if (status !== 'authenticated' && !inAuthGroup) {
      // No autenticado → redirigir a login
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      // Ya autenticado → redirigir a home
      router.replace('/(tabs)');
    }
  }, [status, segments]);

  if (!fontsLoaded || status === 'loading') {
    return null; // Splash screen visible
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
