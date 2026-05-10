import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOWS } from '@/utils/constants';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconOutline: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Inicio', icon: 'home', iconOutline: 'home-outline' },
  { name: 'tasks', title: 'Misiones', icon: 'compass', iconOutline: 'compass-outline' },
  { name: 'calendar', title: 'Calendario', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'expenses', title: 'Gastos', icon: 'wallet', iconOutline: 'wallet-outline' },
  { name: 'settings', title: 'Perfil', icon: 'person', iconOutline: 'person-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...SHADOWS.card,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeIconWrapper : undefined}>
                <Ionicons
                  name={focused ? tab.icon : tab.iconOutline}
                  size={focused ? size + 2 : size}
                  color={color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
    ...SHADOWS.glowCyan,
  },
});
