import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingActionButton from '@/presentation/components/FloatingActionButton';
import TaskItem from '@/presentation/components/TaskItem';
import { useTaskStore } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import type { Task } from '@/core/entities/Task';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const addTask = useTaskStore((state) => state.addTask);
  const xpBarAnim = useRef(new Animated.Value(0)).current;

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
    const totalXP = totalWeight * 10;
    const milestones = [100, 250, 500, 750, 1000, 1500];
    const currentMilestone = milestones.find(m => totalXP < m) ?? 1500;
    const progress = Math.min(Math.round((totalXP / currentMilestone) * 100), 100);
    const remaining = Math.max(currentMilestone - totalXP, 0);
    const level = Math.floor(totalXP / 100) + 1;

    return { totalXP, totalCompleted: weekTasks.length, currentMilestone, progress, remaining, level };
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

  // Animate XP bar
  useEffect(() => {
    Animated.timing(xpBarAnim, {
      toValue: weeklyProgress.progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [weeklyProgress.progress]);

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
        <Text style={styles.loadingText}>Cargando misiones...</Text>
      </View>
    );
  }

  const xpBarWidth = xpBarAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const incentiveMsg = weeklyProgress.totalCompleted === 0
    ? '🗡️ ¡Comienza tu primera misión de la semana!'
    : weeklyProgress.progress >= 100
      ? '🏆 ¡Meta semanal alcanzada! Eres legendario.'
      : `Faltan ${weeklyProgress.remaining} XP para tu logro semanal.`;

  return (
    <View style={styles.screen}>
      <FlatList
        data={rootTasks.filter(t => t.status !== 'completed').slice(0, 5)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appLabel}>QUESTLIST</Text>
              <Text style={styles.title}>Centro de Operaciones</Text>
              <Text style={styles.subtitle}>Panel de misiones activas</Text>
            </View>

            {/* XP / Level Card */}
            <View style={styles.levelCard}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Ionicons name="star" size={16} color={COLORS.gold} />
                  <Text style={styles.levelText}>Nv. {weeklyProgress.level}</Text>
                </View>
                <Text style={styles.xpCounter}>
                  {weeklyProgress.totalXP} / {weeklyProgress.currentMilestone} XP
                </Text>
              </View>
              <View style={styles.xpBarBg}>
                <Animated.View style={[styles.xpBarFill, { width: xpBarWidth }]} />
              </View>
              <Text style={styles.incentiveText}>{incentiveMsg}</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardWarning]}>
                <Ionicons name="hourglass-outline" size={20} color={COLORS.warning} />
                <Text style={[styles.statNumber, { color: COLORS.warning }]}>{todayStats.pending}</Text>
                <Text style={styles.statLabel}>PENDIENTES</Text>
              </View>
              <View style={[styles.statCard, styles.statCardCyan]}>
                <Ionicons name="checkmark-done-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.statNumber, { color: COLORS.primary }]}>{todayStats.completed}</Text>
                <Text style={styles.statLabel}>COMPLETADAS</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="layers-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.statNumber}>{todayStats.total}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
            </View>

            {/* Completed this week */}
            <View style={styles.weekCard}>
              <View style={styles.weekRow}>
                <View style={styles.weekStatItem}>
                  <Ionicons name="flame-outline" size={16} color={COLORS.accent} />
                  <Text style={styles.weekStatValue}>{weeklyProgress.totalCompleted}</Text>
                  <Text style={styles.weekStatLabel}>misiones</Text>
                </View>
                <View style={styles.weekDivider} />
                <View style={styles.weekStatItem}>
                  <Ionicons name="flash-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.weekStatValue}>{weeklyProgress.totalXP}</Text>
                  <Text style={styles.weekStatLabel}>XP ganado</Text>
                </View>
                <View style={styles.weekDivider} />
                <View style={styles.weekStatItem}>
                  <Ionicons name="trophy-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.weekStatValue}>Nv.{weeklyProgress.level}</Text>
                  <Text style={styles.weekStatLabel}>rango</Text>
                </View>
              </View>
            </View>

            {/* Projects */}
            {projects.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="rocket-outline" size={14} color={COLORS.primary} /> PROYECTOS ACTIVOS
                </Text>
                {projects.map(p => {
                  const barColor = p.progress >= 100 ? COLORS.success : p.progress >= 50 ? COLORS.warning : COLORS.primary;
                  return (
                    <View key={p.id} style={styles.projectCard}>
                      <View style={styles.projectHeader}>
                        <View style={styles.projectTitleRow}>
                          <View style={[styles.projectDot, { backgroundColor: barColor }]} />
                          <Text style={styles.projectTitle}>{p.title}</Text>
                        </View>
                        <Text style={[styles.projectPct, { color: barColor }]}>{p.progress}%</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${p.progress}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.projectMeta}>
                        {p.completedSubs}/{p.totalSubs} sub-misiones · ⚡ {(p.completedSubs * 30)} XP
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            <Text style={styles.sectionTitle}>
              <Ionicons name="compass-outline" size={14} color={COLORS.primary} /> MISIONES RECIENTES
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="planet-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin misiones activas</Text>
            <Text style={styles.emptyText}>Pulsa + para crear tu primera misión y ganar XP.</Text>
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

  // Header
  header: { marginBottom: SPACING.lg },
  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: { fontSize: TYPOGRAPHY.hero, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },

  // Level / XP Card
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    marginBottom: SPACING.lg,
    ...SHADOWS.glowCyan,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.gold}40`,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  xpCounter: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  xpBarBg: {
    height: 10,
    backgroundColor: COLORS.surfaceBright,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  incentiveText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  statCardWarning: {
    borderColor: `${COLORS.warning}30`,
    backgroundColor: `${COLORS.warning}08`,
  },
  statCardCyan: {
    borderColor: `${COLORS.primary}30`,
    backgroundColor: COLORS.primaryDim,
  },
  statNumber: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Weekly summary
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  weekStatItem: { alignItems: 'center', gap: 2 },
  weekStatValue: { fontSize: TYPOGRAPHY.lg, fontWeight: '800', color: COLORS.textPrimary },
  weekStatLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, fontWeight: '600' },
  weekDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Section titles
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },

  // Projects
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  projectDot: { width: 8, height: 8, borderRadius: 4 },
  projectTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  projectPct: { fontSize: TYPOGRAPHY.lg, fontWeight: '800' },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceBright,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarFill: { height: '100%', borderRadius: RADIUS.full },
  projectMeta: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 6 },

  // Empty
  separator: { height: 10 },
  emptyCard: { alignItems: 'center', paddingVertical: SPACING.huge, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.md, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
