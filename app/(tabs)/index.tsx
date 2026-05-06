import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingActionButton from '@/presentation/components/FloatingActionButton';
import TaskItem from '@/presentation/components/TaskItem';
import { useTaskStore } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING } from '@/utils/constants';
import type { Task } from '@/core/entities/Task';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const addTask = useTaskStore((state) => state.addTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const rootTasks = tasks.filter((t) => !t.parent_id);
  const pendingCount = rootTasks.filter((t) => t.status === 'pending').length;
  const completedCount = rootTasks.filter((t) => t.status === 'completed').length;

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async () => {
    await addTask({
      title: `Nueva Tarea ${rootTasks.length + 1}`,
      status: 'pending',
      priority: 'medium',
      due_date: undefined,
      parent_id: null,
      is_synced: false,
    });
  };

  const handlePressTask = (task: Task) => {
    router.push({ pathname: '/task/[id]', params: { id: task.id } });
  };

  if (isLoading && tasks.length === 0) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={rootTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.greeting}>TaskFlow</Text>
              <Text style={styles.title}>Mis tareas</Text>
            </View>

            {/* Stats cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={[styles.statCard, styles.statCardAccent]}>
                <Text style={[styles.statNumber, styles.statNumberAccent]}>{completedCount}</Text>
                <Text style={[styles.statLabel, styles.statLabelAccent]}>Completadas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{rootTasks.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              {rootTasks.length === 0 ? 'Sin tareas aún' : `${rootTasks.length} tareas`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="checkbox-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>¡Todo limpio!</Text>
            <Text style={styles.emptyText}>Presiona el botón + para agregar tu primera tarea.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={handlePressTask}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FloatingActionButton onPress={handleAddTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.md,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardAccent: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statNumberAccent: {
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statLabelAccent: {
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
