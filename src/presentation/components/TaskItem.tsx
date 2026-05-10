import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '@/core/entities/Task';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  low:    { color: COLORS.priorityLow,    label: 'Fácil',    icon: 'shield-outline' },
  medium: { color: COLORS.priorityMedium, label: 'Media',    icon: 'shield-half-outline' },
  high:   { color: COLORS.priorityHigh,   label: 'Difícil',  icon: 'shield' },
  urgent: { color: COLORS.priorityUrgent, label: 'Crítica',  icon: 'flame' },
};

interface TaskItemProps {
  task: Task;
  onPress: (task: Task) => void;
}

export default function TaskItem({ task, onPress }: TaskItemProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const isCompleted = task.status === 'completed';
  const isUrgent = task.priority === 'urgent';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isUrgent && styles.containerUrgent,
        isCompleted && styles.containerCompleted,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(task)}
    >
      {/* Priority accent bar */}
      <View style={[styles.accentBar, { backgroundColor: priority.color }]} />

      <View style={styles.content}>
        {/* Top row: status + title */}
        <View style={styles.row}>
          <View style={[styles.statusDot, { borderColor: isCompleted ? COLORS.success : priority.color }]}>
            {isCompleted && (
              <Ionicons name="checkmark" size={12} color={COLORS.success} />
            )}
          </View>
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flame" size={10} color={COLORS.accent} />
            </View>
          )}
        </View>

        {/* Bottom row: priority badge + XP + due date + arrow */}
        <View style={styles.metaRow}>
          {/* Priority badge */}
          <View style={[styles.badge, { backgroundColor: `${priority.color}18`, borderColor: `${priority.color}50` }]}>
            <Ionicons name={priority.icon} size={10} color={priority.color} />
            <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>

          {/* XP reward */}
          {task.weight && (
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>⚡ {task.weight * 10} XP</Text>
            </View>
          )}

          {/* Due date */}
          {task.due_date && (
            <View style={styles.dueDateRow}>
              <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
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
    ...SHADOWS.card,
  },
  containerUrgent: {
    borderColor: `${COLORS.accent}40`,
    backgroundColor: COLORS.accentDim,
  },
  containerCompleted: {
    opacity: 0.6,
    borderColor: `${COLORS.success}30`,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  accentBar: {
    width: 3,
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
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  urgentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpBadge: {
    backgroundColor: COLORS.goldDim,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  xpText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.gold,
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
