import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { initializeNotifications } from '@/infrastructure/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    void initializeNotifications();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task/[id]"
          options={{
            headerShown: true,
            title: 'Detalle de tarea',
          }}
        />
      </Stack>
    </View>
  );
}
