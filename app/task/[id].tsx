import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTaskStore } from '@/presentation/store/taskStore';
import { CreateTaskForm } from '@/presentation/components/CreateTaskForm';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  low:    { color: COLORS.priorityLow,    label: 'Fácil',   icon: 'shield-outline' },
  medium: { color: COLORS.priorityMedium, label: 'Media',   icon: 'shield-half-outline' },
  high:   { color: COLORS.priorityHigh,   label: 'Difícil', icon: 'shield' },
  urgent: { color: COLORS.priorityUrgent, label: 'Crítica', icon: 'flame' },
};

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const task = useTaskStore((state) =>
    taskId ? state.tasks.find((item) => item.id === taskId) : undefined
  );
  const getSubtasks = useTaskStore((state) => state.getSubtasks);
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  if (!taskId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.accent} />
        <Text style={styles.errorText}>Ruta inválida: falta el id de misión.</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>No se encontró la misión solicitada.</Text>
      </View>
    );
  }

  const subtasks = getSubtasks(taskId);
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const isCompleted = task.status === 'completed';
  const xp = (task.weight || 3) * 10;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar misión',
      '¿Seguro que deseas eliminar esta misión y sus sub-misiones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(taskId);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'time-outline'}
            size={12}
            color={isCompleted ? COLORS.success : COLORS.warning}
          />
          <Text style={[styles.statusText, isCompleted && styles.statusTextCompleted]}>
            {isCompleted ? 'Completada' : task.status}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name={priority.icon} size={16} color={priority.color} />
            <Text style={[styles.infoLabel, { color: priority.color }]}>{priority.label}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flash-outline" size={16} color={COLORS.gold} />
            <Text style={[styles.infoLabel, { color: COLORS.gold }]}>+{xp} XP</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoValue}>
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
                : 'Sin fecha'}
            </Text>
          </View>
        </View>
        {task.description ? <Text style={styles.description}>{task.description}</Text> : null}
      </View>

      {/* Acciones principales */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => toggleComplete(taskId)}
          style={[styles.actionBtn, isCompleted ? styles.reopenBtn : styles.completeBtn]}
        >
          <Ionicons
            name={isCompleted ? 'refresh-outline' : 'checkmark-done'}
            size={18}
            color={isCompleted ? COLORS.warning : COLORS.textInverse}
          />
          <Text style={[styles.actionText, { color: isCompleted ? COLORS.warning : COLORS.textInverse }]}>
            {isCompleted ? 'Reabrir' : 'Completar'}
          </Text>
        </Pressable>
        <Pressable onPress={handleDelete} style={[styles.actionBtn, styles.deleteBtn]}>
          <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
          <Text style={[styles.actionText, { color: COLORS.accent }]}>Eliminar</Text>
        </Pressable>
      </View>

      {/* Add subtask */}
      <Pressable onPress={() => setShowSubtaskForm(true)} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.textInverse} />
        <Text style={styles.addButtonText}>AGREGAR SUB-MISIÓN</Text>
      </Pressable>

      {/* Subtasks section */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="git-branch-outline" size={14} color={COLORS.primary} />{' '}
        SUB-MISIONES ({subtasks.length})
      </Text>

      {subtasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Sin sub-misiones asignadas.</Text>
        </View>
      ) : (
        subtasks.map((subtask) => {
          const subCompleted = subtask.status === 'completed';
          return (
            <View
              key={subtask.id}
              style={[styles.subtaskCard, subCompleted && styles.subtaskCardCompleted]}
            >
              <Pressable
                onPress={() => toggleComplete(subtask.id)}
                hitSlop={8}
                style={[styles.subtaskDot, { borderColor: subCompleted ? COLORS.success : COLORS.textMuted }]}
              >
                {subCompleted && <Ionicons name="checkmark" size={10} color={COLORS.success} />}
              </Pressable>
              <Pressable
                style={styles.subtaskInfo}
                onPress={() => router.push({ pathname: '/task/[id]', params: { id: subtask.id } })}
              >
                <Text style={[styles.subtaskTitle, subCompleted && styles.subtaskTitleCompleted]}>
                  {subtask.title}
                </Text>
                <Text style={styles.subtaskMeta}>
                  {subCompleted ? '✅ Completada' : `⏳ ${subtask.status}`}
                  {' · ⚡ '}{((subtask.weight || 3) * 10)} XP
                </Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </View>
          );
        })
      )}

      <CreateTaskForm
        visible={showSubtaskForm}
        onClose={() => setShowSubtaskForm(false)}
        parentId={taskId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    minHeight: '100%',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.huge,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.warning}18`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.warning}40`,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.secondaryDim,
    borderColor: `${COLORS.success}40`,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextCompleted: {
    color: COLORS.success,
  },

  // Info card
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  description: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Acciones
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
  },
  completeBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glowCyan,
  },
  reopenBtn: {
    backgroundColor: `${COLORS.warning}18`,
    borderColor: `${COLORS.warning}60`,
  },
  deleteBtn: {
    backgroundColor: COLORS.accentDim,
    borderColor: `${COLORS.accent}60`,
  },
  actionText: {
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Section
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginTop: SPACING.sm,
  },

  // Add button
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.glowCyan,
  },
  addButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sm,
    letterSpacing: 1,
  },

  // Subtask card
  subtaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subtaskCardCompleted: {
    opacity: 0.6,
    borderColor: `${COLORS.success}30`,
  },
  subtaskDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskInfo: { flex: 1, gap: 2 },
  subtaskTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  subtaskMeta: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.xs,
  },

  // Empty
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.md,
  },
  errorText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.lg,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
