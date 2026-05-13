/**
 * @file TaskCard.tsx
 * @layer presentation/components/task
 * @description Tarjeta de tarea estilo HUD cyberpunk con esquinas neón, barra de prioridad
 * vertical iluminada y barra de progreso segmentada tipo videojuego.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskWithChildrenMeta, TaskPriority } from '@/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { formatDueDate, isOverdue } from '@/utils/dateHelpers';

interface TaskCardProps {
  task: TaskWithChildrenMeta;
  onPress: () => void;
  onToggleComplete: () => void;
}

interface PriorityConfig {
  color: string;
  label: string;
  glow: ViewStyle;
}

const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  low:    { color: COLORS.priorityLow,    label: 'EASY',     glow: SHADOWS.glowCyanSoft as ViewStyle },
  medium: { color: COLORS.priorityMedium, label: 'NORMAL',   glow: SHADOWS.glowGold as ViewStyle },
  high:   { color: COLORS.priorityHigh,   label: 'HARD',     glow: SHADOWS.glowMagenta as ViewStyle },
  urgent: { color: COLORS.priorityUrgent, label: 'CRITICAL', glow: SHADOWS.glowRed as ViewStyle },
};

const CORNER_SIZE = 12;
const CORNER_THICKNESS = 2;

export function TaskCard({ task, onPress, onToggleComplete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && task.due_date ? isOverdue(task.due_date) : false;
  const priority = PRIORITY_CONFIG[task.priority];
  const hasSubtasks = task.subtask_count > 0;
  const subtaskProgress = hasSubtasks
    ? (task.completed_subtask_count / task.subtask_count) * 100
    : 0;

  // Color del marco según estado
  const frameColor = isCompleted
    ? COLORS.secondary
    : overdue
      ? COLORS.danger
      : priority.color;

  return (
    <View style={[styles.wrapper, !isCompleted && priority.glow]}>
      <TouchableOpacity
        style={[
          styles.card,
          { borderColor: `${frameColor}55` },
          isCompleted && styles.cardCompleted,
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Barra lateral de prioridad – glow */}
        <View style={[styles.priorityBar, { backgroundColor: frameColor, shadowColor: frameColor }]} />

        <View style={styles.content}>
          <View style={styles.mainRow}>
            {/* Checkbox angular cyberpunk */}
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: isCompleted ? COLORS.secondary : COLORS.borderLight },
                isCompleted && styles.checkboxCompleted,
              ]}
              onPress={onToggleComplete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color={COLORS.background} />
              )}
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text
                style={[styles.title, isCompleted && styles.titleCompleted]}
                numberOfLines={2}
              >
                {task.title}
              </Text>

              <View style={styles.metaRow}>
                {/* Priority badge HUD */}
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: `${priority.color}1A`, borderColor: `${priority.color}80` },
                  ]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                  <Text style={[styles.priorityLabel, { color: priority.color }]}>
                    {priority.label}
                  </Text>
                </View>

                {/* Due date */}
                {task.due_date && (
                  <View
                    style={[
                      styles.dueBadge,
                      overdue && { borderColor: `${COLORS.danger}60` },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={overdue ? COLORS.danger : COLORS.textSecondary}
                    />
                    <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                      {formatDueDate(task.due_date)}
                    </Text>
                  </View>
                )}

                {task.is_synced && (
                  <View style={styles.syncBadge}>
                    <Ionicons name="sync" size={10} color={COLORS.primary} />
                  </View>
                )}
              </View>
            </View>

            {/* Chevron neón */}
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={14} color={frameColor} />
            </View>
          </View>

          {/* Subtask progress – barra segmentada HUD */}
          {hasSubtasks && (
            <View style={styles.subtaskSection}>
              <View style={styles.subtaskHeader}>
                <Ionicons name="git-branch-outline" size={11} color={COLORS.textSecondary} />
                <Text style={styles.subtaskCount}>
                  {task.completed_subtask_count}/{task.subtask_count} OBJETIVOS
                </Text>
                <Text style={[styles.subtaskPct, { color: frameColor }]}>
                  {Math.round(subtaskProgress)}%
                </Text>
              </View>
              <View style={styles.subtaskBar}>
                <View
                  style={[
                    styles.subtaskFill,
                    { width: `${subtaskProgress}%`, backgroundColor: frameColor, shadowColor: frameColor },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Esquinas HUD neón */}
      <View
        pointerEvents="none"
        style={[
          styles.corner,
          styles.topLeft,
          {
            width: CORNER_SIZE,
            height: CORNER_SIZE,
            borderTopWidth: CORNER_THICKNESS,
            borderLeftWidth: CORNER_THICKNESS,
            borderColor: frameColor,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.corner,
          styles.bottomRight,
          {
            width: CORNER_SIZE,
            height: CORNER_SIZE,
            borderBottomWidth: CORNER_THICKNESS,
            borderRightWidth: CORNER_THICKNESS,
            borderColor: frameColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardCompleted: {
    opacity: 0.55,
    backgroundColor: COLORS.surfaceHigh,
  },
  priorityBar: {
    width: 3,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  content: { flex: 1, padding: SPACING.md },
  mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.glowGreen,
  },
  textContainer: { flex: 1, gap: 6 },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  titleCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  priorityDot: { width: 5, height: 5, borderRadius: 1 },
  priorityLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dueText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, fontWeight: '600' },
  dueTextOverdue: { color: COLORS.danger, fontWeight: '700' },
  syncBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskSection: { marginTop: SPACING.sm, gap: 4 },
  subtaskHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subtaskCount: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  subtaskPct: { fontSize: TYPOGRAPHY.xs, fontWeight: '800', letterSpacing: 0.5 },
  subtaskBar: {
    height: 4,
    backgroundColor: COLORS.surfaceBright,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subtaskFill: {
    height: '100%',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  corner: {
    position: 'absolute',
  },
  topLeft: { top: -2, left: -2 },
  bottomRight: { bottom: -2, right: -2 },
});
