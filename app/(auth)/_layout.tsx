/**
 * @file (auth)/_layout.tsx
 * @description Layout del grupo de autenticación.
 * No tiene tab bar ni header.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
