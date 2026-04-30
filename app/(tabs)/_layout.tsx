/**
 * @file (tabs)/_layout.tsx
 * @description Configuración del Tab Navigator con Expo Router.
 * 4 tabs: Hoy, Tareas, Calendario, Ajustes.
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/src/utils/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'index', title: 'Hoy', icon: 'sunny-outline', activeIcon: 'sunny' },
  { name: 'tasks', title: 'Tareas', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
  { name: 'calendar', title: 'Calendario', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'settings', title: 'Ajustes', icon: 'settings-outline', activeIcon: 'settings' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'android' ? 8 : 0,
          height: Platform.OS === 'android' ? 64 : 80,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.xs,
          fontWeight: '500',
          marginTop: -4,
        },
      }}
    >
      {TAB_CONFIG.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
