import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { initializeNotifications } from '@/infrastructure/services/notifications';
import { useAuthStore } from '@/presentation/store/authStore';
import { useTaskStore } from '@/presentation/store/taskStore';
import { useExpenseStore } from '@/presentation/store/expenseStore';
import { useWeightStore } from '@/presentation/store/weightStore';
import { COLORS } from '@/utils/constants';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const navigationState = useRootNavigationState();

  const loadTasks = useTaskStore((s) => s.loadTasks);
  const subscribeToRealtime = useTaskStore((s) => s.subscribeToRealtime);
  const unsubscribeFromRealtime = useTaskStore((s) => s.unsubscribeFromRealtime);

  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const subscribeExpenses = useExpenseStore((s) => s.subscribeToRealtime);
  const unsubscribeExpenses = useExpenseStore((s) => s.unsubscribeFromRealtime);

  const loadWeights = useWeightStore((s) => s.loadWeights);
  const subscribeWeights = useWeightStore((s) => s.subscribeToRealtime);
  const unsubscribeWeights = useWeightStore((s) => s.unsubscribeFromRealtime);

  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
    void initializeNotifications();
  }, []);

  // Cargar datos y suscribirse a Realtime cuando el usuario está autenticado
  useEffect(() => {
    if (!user) return;

    void loadTasks();
    subscribeToRealtime();
    void loadExpenses();
    subscribeExpenses();
    void loadWeights();
    subscribeWeights();

    return () => {
      unsubscribeFromRealtime();
      unsubscribeExpenses();
      unsubscribeWeights();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!navigationState?.key) return;

    // Esperar a que restoreSession termine antes de tomar decisiones de navegación
    if (authStatus === 'loading') return;

    // Usamos setTimeout para asegurarnos de que el ciclo de renderizado ha finalizado 
    // y el RootLayout está 100% montado antes de intentar navegar.
    const timeout = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!accessToken && !inAuthGroup) {
        // Si no está logueado y no está en auth, mandarlo a login
        router.replace('/(auth)/login');
      } else if (accessToken && inAuthGroup) {
        // Si está logueado y está en auth, mandarlo a las tabs
        router.replace('/(tabs)');
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [accessToken, authStatus, segments, navigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task/[id]"
          options={{
            headerShown: true,
            title: 'Detalle de Misión',
          }}
        />
      </Stack>
    </View>
  );
}
