import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '@/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';

const PRIORITY_COLORS: Record<string, string> = {
  low: COLORS.priorityLow,
  medium: COLORS.priorityMedium,
  high: COLORS.priorityHigh,
  urgent: COLORS.priorityUrgent,
};

interface TaskItemProps {
  task: Task;
  onPress: (task: Task) => void;
}

export default function TaskItem({ task, onPress }: TaskItemProps) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? COLORS.textMuted;
  const isCompleted = task.status === 'completed';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(task)}
    >
      {/* Priority indicator */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.content}>
        <View style={styles.row}>
          {/* Completed icon */}
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={isCompleted ? COLORS.success : COLORS.textMuted}
          />
          <Text style={[styles.title, isCompleted && styles.titleCompleted]} numberOfLines={1}>
            {task.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { borderColor: priorityColor }]}>
            <Text style={[styles.priority, { color: priorityColor }]}>{task.priority}</Text>
          </View>
          {task.due_date && (
            <View style={styles.dueDateRow}>
              <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.dueDate}>
                {new Date(task.due_date).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
          <View style={styles.spacer} />
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priority: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
  spacer: { flex: 1 },
});
