/**
 * @file TaskCard.tsx
 * @layer presentation/components/task
 * @description Componente de tarjeta de tarea con indicadores visuales de prioridad,
 * progreso de subtareas y badge de sincronización con Google.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskWithChildrenMeta, TaskPriority } from '@/src/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/src/utils/constants';
import { formatDueDate, isOverdue } from '@/src/utils/dateHelpers';

interface TaskCardProps {
  task: TaskWithChildrenMeta;
  onPress: () => void;
  onToggleComplete: () => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; label: string; dot: string }> = {
  low:    { color: COLORS.priorityLow,    label: 'Baja',    dot: '🔵' },
  medium: { color: COLORS.priorityMedium, label: 'Media',   dot: '🟡' },
  high:   { color: COLORS.priorityHigh,   label: 'Alta',    dot: '🟠' },
  urgent: { color: COLORS.urgent,         label: 'Urgente', dot: '🔴' },
};

export function TaskCard({ task, onPress, onToggleComplete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && task.due_date ? isOverdue(task.due_date) : false;
  const priority = PRIORITY_CONFIG[task.priority];
  const hasSubtasks = task.subtask_count > 0;
  const subtaskProgress = hasSubtasks
    ? (task.completed_subtask_count / task.subtask_count) * 100
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        overdue && styles.cardOverdue,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Indicador de prioridad (barra lateral) */}
      <View style={[styles.priorityBar, { backgroundColor: priority.color }]} />

      <View style={styles.content}>
        {/* Row principal */}
        <View style={styles.mainRow}>
          {/* Checkbox */}
          <TouchableOpacity
            style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
            onPress={onToggleComplete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={14} color={COLORS.background} />
            )}
          </TouchableOpacity>

          {/* Título y metadata */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, isCompleted && styles.titleCompleted]} numberOfLines={2}>
              {task.title}
            </Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              {/* Priority badge */}
              <View style={[styles.priorityBadge, { backgroundColor: `${priority.color}20` }]}>
                <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                <Text style={[styles.priorityLabel, { color: priority.color }]}>
                  {priority.label}
                </Text>
              </View>

              {/* Due date */}
              {task.due_date && (
                <View style={[styles.dueBadge, overdue && styles.dueBadgeOverdue]}>
                  <Ionicons
                    name="time-outline"
                    size={11}
                    color={overdue ? COLORS.danger : COLORS.textMuted}
                  />
                  <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                    {formatDueDate(task.due_date)}
                  </Text>
                </View>
              )}

              {/* Google sync badge */}
              {task.is_synced && (
                <Ionicons name="logo-google" size={13} color={COLORS.textMuted} />
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>

        {/* Subtask progress */}
        {hasSubtasks && (
          <View style={styles.subtaskSection}>
            <View style={styles.subtaskHeader}>
              <Ionicons name="git-branch-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.subtaskCount}>
                {task.completed_subtask_count}/{task.subtask_count} subtareas
              </Text>
            </View>
            <View style={styles.subtaskBar}>
              <View style={[styles.subtaskFill, { width: `${subtaskProgress}%` }]} />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardCompleted: { opacity: 0.6 },
  cardOverdue: { borderColor: `${COLORS.danger}50` },
  priorityBar: { width: 3 },
  content: { flex: 1, padding: SPACING.md },
  mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxCompleted: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  textContainer: { flex: 1, gap: SPACING.xs },
  title: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  titleCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.xs },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  priorityDot: { width: 5, height: 5, borderRadius: 3 },
  priorityLabel: { fontSize: TYPOGRAPHY.xs, fontWeight: '600' },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dueBadgeOverdue: {},
  dueText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  dueTextOverdue: { color: COLORS.danger, fontWeight: '600' },
  subtaskSection: { marginTop: SPACING.sm, gap: SPACING.xs },
  subtaskHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subtaskCount: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  subtaskBar: { height: 3, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  subtaskFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
});
