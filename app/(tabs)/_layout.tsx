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
  { name: 'index',    title: 'HUB',      icon: 'home',     iconOutline: 'home-outline' },
  { name: 'tasks',    title: 'QUESTS',   icon: 'compass',  iconOutline: 'compass-outline' },
  { name: 'calendar', title: 'AGENDA',   icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'expenses', title: 'CREDITS',  icon: 'wallet',   iconOutline: 'wallet-outline' },
  { name: 'settings', title: 'OPERATOR', icon: 'person',   iconOutline: 'person-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.primary,
          borderTopWidth: 1.5,
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 10,
          shadowColor: COLORS.primary,
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 1.5,
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
              <View style={styles.iconWrapper}>
                {/* Indicador superior neón cuando activo */}
                {focused && <View style={styles.topIndicator} />}

                {/* Halo cyan detrás del icono activo */}
                {focused && <View style={styles.activeBg} />}

                <Ionicons
                  name={focused ? tab.icon : tab.iconOutline}
                  size={focused ? size + 2 : size}
                  color={color}
                  style={focused ? styles.activeIcon : undefined}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 50,
    height: 32,
  },
  topIndicator: {
    position: 'absolute',
    top: -11,
    width: 32,
    height: 2,
    backgroundColor: COLORS.primary,
    ...SHADOWS.glowCyan,
  },
  activeBg: {
    position: 'absolute',
    width: 38,
    height: 28,
    borderRadius: 4,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: `${COLORS.primary}60`,
  },
  activeIcon: {
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
