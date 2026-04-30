/**
 * @file (tabs)/index.tsx  → Tab "Hoy"
 * @description Pantalla principal de tareas del día.
 * Muestra el progreso diario, tareas urgentes y lista del día.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import { TaskCard } from '@/src/presentation/components/task/TaskCard';
import { TaskWithChildrenMeta } from '@/src/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/src/utils/constants';
import { formatDateFriendly } from '@/src/utils/dateHelpers';

export default function HomeScreen() {
  const router = useRouter();
  const { todayTasks, todayStats, isLoading, toggleComplete, refresh } = useTasks();

  const handleTaskPress = useCallback((task: TaskWithChildrenMeta) => {
    router.push({ pathname: '/task/[id]', params: { id: task.id } } as any);
  }, [router]);

  const progressPercent = Math.round(todayStats.progress);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={todayTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Buenos días 👋</Text>
                <Text style={styles.dateText}>{formatDateFriendly(new Date())}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => {}}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progreso del día</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <View style={styles.statsRow}>
                <StatBadge label="Total" value={todayStats.total} color={COLORS.textSecondary} />
                <StatBadge label="Completadas" value={todayStats.completed} color={COLORS.success} />
                <StatBadge label="Urgentes" value={todayStats.urgent} color={COLORS.urgent} />
              </View>
            </View>

            {/* Section title */}
            <Text style={styles.sectionTitle}>
              {todayTasks.length > 0 ? `${todayTasks.length} tareas para hoy` : 'Sin tareas para hoy 🎉'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item)}
            onToggleComplete={() => toggleComplete(item.id)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>¡Todo listo para hoy!</Text>
              <Text style={styles.emptySubtitle}>
                No tienes tareas pendientes para hoy.{'\n'}
                Toca + para agregar una nueva.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  dateText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: { fontSize: 28, color: COLORS.background, lineHeight: 32 },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  progressTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  progressPercent: { fontSize: TYPOGRAPHY.md, fontWeight: '700', color: COLORS.primary },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBadge: { alignItems: 'center' },
  statValue: { fontSize: TYPOGRAPHY.xl, fontWeight: '700' },
  statLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, gap: SPACING.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: TYPOGRAPHY.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
