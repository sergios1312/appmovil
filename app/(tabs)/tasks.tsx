/**
 * @file (tabs)/tasks.tsx → Tab "Tareas"
 * @description Lista de todas las tareas con filtros por estado.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '@/presentation/hooks/useTasks';
import { TaskCard } from '@/presentation/components/task/TaskCard';
import { TaskFilter } from '@/infrastructure/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
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
        {FILTERS.map(f => (
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
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => {}} onToggleComplete={() => toggleComplete(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay tareas {activeFilter !== 'all' ? `en "${FILTERS.find(f=>f.key===activeFilter)?.label}"` : ''}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  filtersRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
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
  emptyContainer: { alignItems: 'center', paddingTop: SPACING.xxxl },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted },
});
