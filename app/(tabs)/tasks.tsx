import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '@/presentation/hooks/useTasks';
import TaskItem from '@/presentation/components/TaskItem';
import { TaskFilter } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
];

export default function TasksScreen() {
  const { filteredTasks, activeFilter, setFilter, toggleComplete, isLoading, refresh } = useTasks();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Tareas</Text>
        <Text style={styles.subtitle}>{filteredTasks.length} tareas</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
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
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              No hay tareas{' '}
              {activeFilter !== 'all'
                ? `en "${FILTERS.find((f) => f.key === activeFilter)?.label}"`
                : ''}
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
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterLabel: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, fontWeight: '500' },
  filterLabelActive: { color: COLORS.background, fontWeight: '600' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  emptyContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted, textAlign: 'center' },
});
