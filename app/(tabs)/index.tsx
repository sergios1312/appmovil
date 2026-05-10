import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingActionButton from '@/presentation/components/FloatingActionButton';
import TaskItem from '@/presentation/components/TaskItem';
import { useTaskStore } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';
import type { Task } from '@/core/entities/Task';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const addTask = useTaskStore((state) => state.addTask);

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);

  // Today stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.due_date?.startsWith(today));
    return {
      pending: todayTasks.filter(t => t.status !== 'completed').length,
      completed: todayTasks.filter(t => t.status === 'completed').length,
      total: rootTasks.length,
    };
  }, [tasks, rootTasks]);

  // Weekly gamification
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTasks = tasks.filter(t => {
      const updated = new Date(t.updated_at);
      return updated >= startOfWeek && t.status === 'completed';
    });

    const totalWeight = weekTasks.reduce((acc, t) => acc + (t.weight || 3), 0);
    const milestones = [10, 25, 50, 75, 100, 150];
    const currentMilestone = milestones.find(m => totalWeight < m) ?? 150;
    const progress = Math.min(Math.round((totalWeight / currentMilestone) * 100), 100);
    const remaining = Math.max(currentMilestone - totalWeight, 0);

    return { totalWeight, totalCompleted: weekTasks.length, currentMilestone, progress, remaining };
  }, [tasks]);

  // Projects
  const projects = useMemo(() => {
    return rootTasks.filter(t => t.task_type === 'project').map(project => {
      const getDescendants = (parentId: string): Task[] => {
        const children = tasks.filter(t => t.parent_id === parentId);
        return children.reduce((all, child) => [...all, child, ...getDescendants(child.id)], [] as Task[]);
      };
      const descendants = getDescendants(project.id);
      const completed = descendants.filter(t => t.status === 'completed').length;
      const total = descendants.length;
      return { ...project, progress: total > 0 ? Math.round((completed / total) * 100) : 0, totalSubs: total, completedSubs: completed };
    });
  }, [rootTasks, tasks]);

  useEffect(() => { loadTasks(); }, []);

  const handleAddTask = async () => {
    await addTask({ title: `Nueva Tarea ${rootTasks.length + 1}`, status: 'pending', priority: 'medium', task_type: 'single', weight: 3, hide_from_calendar: false, due_date: undefined, parent_id: null, is_synced: false });
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

  const incentiveMsg = weeklyProgress.totalCompleted === 0
    ? '¡Comienza tu semana completando tu primera tarea!'
    : weeklyProgress.progress >= 100
      ? '🎉 ¡Felicidades! Alcanzaste tu meta semanal.'
      : `Para tu logro semanal, acumula ${weeklyProgress.remaining} puntos más.`;

  return (
    <View style={styles.screen}>
      <FlatList
        data={rootTasks.filter(t => t.status !== 'completed').slice(0, 5)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Dashboard</Text>
              <Text style={styles.title}>Inicio</Text>
              <Text style={styles.subtitle}>Resumen general</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="list-outline" size={18} color={COLORS.warning} />
                <Text style={styles.statNumber}>{todayStats.pending}</Text>
                <Text style={styles.statLabel}>Pendientes hoy</Text>
              </View>
              <View style={[styles.statCard, styles.statCardAccent]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
                <Text style={[styles.statNumber, styles.statNumberAccent]}>{todayStats.completed}</Text>
                <Text style={[styles.statLabel, styles.statLabelAccent]}>Completadas hoy</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="layers-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.statNumber}>{todayStats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Gamification */}
            <Text style={styles.sectionTitle}>
              <Ionicons name="trophy-outline" size={14} color={COLORS.primary} /> Logros y progresión
            </Text>
            <View style={styles.gamificationCard}>
              <View style={styles.gamRow}>
                <Text style={styles.gamHighlight}>🔥 {weeklyProgress.totalCompleted} tareas esta semana</Text>
                <Text style={styles.gamPoints}>{weeklyProgress.totalWeight}/{weeklyProgress.currentMilestone} pts</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${weeklyProgress.progress}%` }]} />
              </View>
              <Text style={styles.gamIncentive}>{incentiveMsg}</Text>
            </View>

            {/* Projects */}
            {projects.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="rocket-outline" size={14} color={COLORS.primary} /> Proyectos
                </Text>
                {projects.map(p => (
                  <TouchableOpacity key={p.id} style={styles.projectCard} onPress={() => handlePressTask(p)}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectTitle}>{p.title}</Text>
                      <Text style={styles.projectPct}>{p.progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${p.progress}%`, backgroundColor: p.progress >= 100 ? COLORS.success : p.progress >= 50 ? COLORS.warning : COLORS.primary }]} />
                    </View>
                    <Text style={styles.projectMeta}>{p.completedSubs}/{p.totalSubs} subtareas</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={styles.sectionTitle}>Tareas recientes</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="checkbox-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>¡Todo limpio!</Text>
            <Text style={styles.emptyText}>Presiona el botón + para agregar tu primera tarea.</Text>
          </View>
        }
        renderItem={({ item }) => <TaskItem task={item} onPress={handlePressTask} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <FloatingActionButton onPress={handleAddTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.md },
  container: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  header: { marginBottom: SPACING.lg },
  greeting: { fontSize: TYPOGRAPHY.sm, color: COLORS.primary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: TYPOGRAPHY.xxxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  statCardAccent: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  statNumber: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary },
  statNumberAccent: { color: COLORS.primary },
  statLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  statLabelAccent: { color: COLORS.primary },
  sectionTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.md },
  gamificationCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  gamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gamHighlight: { fontSize: TYPOGRAPHY.sm, fontWeight: '600', color: COLORS.primary },
  gamPoints: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  gamIncentive: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 8 },
  progressBarBg: { height: 8, backgroundColor: COLORS.surfaceHigh, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 999 },
  projectCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  projectTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  projectPct: { fontSize: TYPOGRAPHY.md, fontWeight: '700', color: COLORS.primary },
  projectMeta: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 6 },
  separator: { height: 10 },
  emptyCard: { alignItems: 'center', paddingVertical: SPACING.xxxl, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.md, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
