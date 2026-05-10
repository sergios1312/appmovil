import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/utils/constants';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconOutline: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Inicio', icon: 'home', iconOutline: 'home-outline' },
  { name: 'tasks', title: 'Tareas', icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline' },
  { name: 'calendar', title: 'Calendario', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'expenses', title: 'Gastos', icon: 'wallet', iconOutline: 'wallet-outline' },
  { name: 'settings', title: 'Ajustes', icon: 'settings', iconOutline: 'settings-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
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
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
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
