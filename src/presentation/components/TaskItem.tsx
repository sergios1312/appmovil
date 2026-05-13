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

  const frameColor = isCompleted ? COLORS.secondary : priority.color;

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          { borderColor: `${frameColor}50` },
          isUrgent && styles.containerUrgent,
          isCompleted && styles.containerCompleted,
          pressed && styles.pressed,
        ]}
        onPress={() => onPress(task)}
      >
        {/* Priority accent bar con glow */}
        <View style={[styles.accentBar, { backgroundColor: frameColor, shadowColor: frameColor }]} />

        <View style={styles.content}>
          {/* Top row: status + title */}
          <View style={styles.row}>
            <View style={[styles.statusDot, { borderColor: isCompleted ? COLORS.secondary : frameColor }]}>
              {isCompleted && (
                <Ionicons name="checkmark" size={12} color={COLORS.secondary} />
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
            <View style={[styles.badge, { backgroundColor: `${priority.color}1A`, borderColor: `${priority.color}80` }]}>
              <Ionicons name={priority.icon} size={10} color={priority.color} />
              <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
            </View>

            {task.weight && (
              <View style={styles.xpBadge}>
                <Ionicons name="flash" size={9} color={COLORS.gold} />
                <Text style={styles.xpText}>{task.weight * 10} XP</Text>
              </View>
            )}

            {task.due_date && (
              <View style={styles.dueDateRow}>
                <Ionicons name="time-outline" size={10} color={COLORS.textSecondary} />
                <Text style={styles.dueDate}>
                  {new Date(task.due_date).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>
            )}

            <View style={styles.spacer} />
            <Ionicons name="chevron-forward" size={14} color={frameColor} />
          </View>
        </View>
      </Pressable>

      {/* Esquinas HUD */}
      <View pointerEvents="none" style={[styles.corner, styles.cornerTL, { borderColor: frameColor }]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBR, { borderColor: frameColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  containerUrgent: {
    ...SHADOWS.glowRed,
  },
  containerCompleted: {
    opacity: 0.55,
    backgroundColor: COLORS.surfaceHigh,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  accentBar: {
    width: 3,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldDim,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${COLORS.gold}60`,
  },
  xpText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  spacer: { flex: 1 },
});
