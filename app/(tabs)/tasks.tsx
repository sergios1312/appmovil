import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '@/presentation/hooks/useTasks';
import TaskItem from '@/presentation/components/TaskItem';
import { TaskFilter } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

const FILTERS: { key: TaskFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'all',       label: 'Todas',      icon: 'grid-outline' },
  { key: 'today',     label: 'Hoy',        icon: 'today-outline' },
  { key: 'pending',   label: 'Activas',    icon: 'compass-outline' },
  { key: 'completed', label: 'Completas',  icon: 'trophy-outline' },
];

export default function TasksScreen() {
  const { filteredTasks, activeFilter, setFilter, toggleComplete, isLoading, refresh } = useTasks();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appLabel}>MISIONES</Text>
        <Text style={styles.title}>Tablero de Misiones</Text>
        <Text style={styles.subtitle}>{filteredTasks.length} misiones en el radar</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon}
              size={12}
              color={activeFilter === f.key ? COLORS.textInverse : COLORS.textMuted}
            />
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => toggleComplete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="planet-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Zona despejada</Text>
            <Text style={styles.emptyText}>
              No hay misiones{' '}
              {activeFilter !== 'all'
                ? `en "${FILTERS.find((f) => f.key === activeFilter)?.label}"`
                : 'disponibles'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },

  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glowCyan,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  filterLabelActive: {
    color: COLORS.textInverse,
  },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.huge },

  emptyContainer: { alignItems: 'center', paddingTop: SPACING.huge, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted, textAlign: 'center' },
});
