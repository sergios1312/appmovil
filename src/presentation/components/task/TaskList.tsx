/**
 * @file TaskList.tsx
 * @layer presentation/components/task
 * @description Lista de tareas con soporte para secciones, separadores y estado vacío.
 */

import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { TaskCard } from '@/src/presentation/components/task/TaskCard';
import { TaskWithChildrenMeta } from '@/src/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING } from '@/src/utils/constants';

interface TaskListProps {
  tasks: TaskWithChildrenMeta[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onTaskPress: (task: TaskWithChildrenMeta) => void;
  onToggleComplete: (taskId: string) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
  ListHeaderComponent?: React.ReactElement;
}

export function TaskList({
  tasks,
  isLoading = false,
  onRefresh,
  onTaskPress,
  onToggleComplete,
  emptyMessage = 'No hay tareas',
  emptySubMessage = 'Toca + para crear tu primera tarea',
  ListHeaderComponent,
}: TaskListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined
      }
      ListHeaderComponent={ListHeaderComponent}
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          onPress={() => onTaskPress(item)}
          onToggleComplete={() => onToggleComplete(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{emptyMessage}</Text>
            <Text style={styles.emptySubtitle}>{emptySubMessage}</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  separator: { height: SPACING.xs },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl * 1.5,
    gap: SPACING.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
