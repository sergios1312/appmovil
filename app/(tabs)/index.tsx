import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingActionButton from '@/presentation/components/FloatingActionButton';
import TaskItem from '@/presentation/components/TaskItem';
import HexAvatar from '@/presentation/components/ui/HexAvatar';
import { useTaskStore, selectTodayStats } from '@/presentation/store/taskStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import type { Task } from '@/core/entities/Task';
import { getDailyView, isRootTask } from '@/utils/taskFilters';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const addTask = useTaskStore((state) => state.addTask);
  const user = useAuthStore((state) => state.user);
  const xpBarAnim = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);

  // Today stats (con recurrencia: cuenta rutinas del día)
  const todayStats = useMemo(() => {
    const dailyTasks = getDailyView(tasks, new Date());
    const rootDailyTasks = dailyTasks.filter(t => isRootTask(t));
    return {
      pending: rootDailyTasks.filter(t => t.status !== 'completed').length,
      completed: rootDailyTasks.filter(t => t.status === 'completed').length,
      total: rootTasks.length,
      routines: rootDailyTasks.filter(t => t.is_recurrence_instance).length,
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
              <View style={styles.headerTopRow}>
                <Text style={styles.appLabel}>// QUESTLIST_v1.0</Text>
                <View style={styles.timeContainer}>
                  <View style={styles.timeDot} />
                  <Text style={styles.timeText}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <Text style={styles.title}>CENTRO DE OPERACIONES</Text>
              <Text style={styles.subtitle}>
                {currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>

            {/* Operator Card – Avatar hexagonal + nivel */}
            <View style={styles.operatorCard}>
              <HexAvatar
                initials={user?.name?.charAt(0) ?? 'OP'}
                size={62}
                color={COLORS.primary}
                icon="person"
              />
              <View style={styles.operatorInfo}>
                <Text style={styles.operatorLabel}>OPERATOR</Text>
                <Text style={styles.operatorName} numberOfLines={1}>
                  {user?.name ?? 'GUEST_USER'}
                </Text>
                <View style={styles.operatorMetaRow}>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ONLINE</Text>
                  </View>
                  <Text style={styles.tierText}>· TIER {weeklyProgress.level}</Text>
                </View>
              </View>
              {/* Corner accents */}
              <View style={[styles.opCorner, styles.opCornerTL]} />
              <View style={[styles.opCorner, styles.opCornerBR]} />
            </View>

            {/* XP / Level Card – barra segmentada */}
            <View style={styles.levelCard}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Ionicons name="flash" size={14} color={COLORS.gold} />
                  <Text style={styles.levelText}>LVL {weeklyProgress.level}</Text>
                </View>
                <Text style={styles.xpCounter}>
                  <Text style={{ color: COLORS.primary }}>{weeklyProgress.totalXP}</Text>
                  <Text style={{ color: COLORS.textSecondary }}> / {weeklyProgress.currentMilestone} XP</Text>
                </Text>
              </View>

              {/* Barra XP segmentada estilo HUD */}
              <View style={styles.xpBarSegmented}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const segActive = i < Math.floor(weeklyProgress.progress / 5);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.xpSegment,
                        segActive && styles.xpSegmentActive,
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.xpFooter}>
                <Ionicons name="chevron-forward" size={10} color={COLORS.primary} />
                <Text style={styles.incentiveText}>{incentiveMsg}</Text>
              </View>

              {/* Esquinas neón */}
              <View style={[styles.lvlCorner, styles.lvlCornerTL]} />
              <View style={[styles.lvlCorner, styles.lvlCornerTR]} />
              <View style={[styles.lvlCorner, styles.lvlCornerBL]} />
              <View style={[styles.lvlCorner, styles.lvlCornerBR]} />
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
  header: { marginBottom: SPACING.md },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: `${COLORS.primary}50`,
  },
  timeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },

  // Operator Card
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: SPACING.md,
    position: 'relative',
    ...SHADOWS.glowCyanSoft,
  },
  operatorInfo: { flex: 1, gap: 2 },
  operatorLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  operatorName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  operatorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}60`,
    backgroundColor: COLORS.secondaryDim,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    fontSize: 9,
    color: COLORS.secondary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tierText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  opCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: COLORS.primary,
  },
  opCornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  opCornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },

  // Level / XP Card
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    marginBottom: SPACING.lg,
    position: 'relative',
    ...SHADOWS.glowCyan,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.goldDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: `${COLORS.gold}80`,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 1.2,
  },
  xpCounter: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Barra XP segmentada estilo HUD
  xpBarSegmented: {
    flexDirection: 'row',
    gap: 2,
    height: 14,
    paddingHorizontal: 2,
    paddingVertical: 2,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpSegment: {
    flex: 1,
    backgroundColor: COLORS.surfaceBright,
    borderRadius: 1,
  },
  xpSegmentActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },

  xpFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
  },
  incentiveText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  lvlCorner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: COLORS.primary,
  },
  lvlCornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  lvlCornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  lvlCornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  lvlCornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    position: 'relative',
  },
  statCardWarning: {
    borderColor: `${COLORS.warning}50`,
    backgroundColor: `${COLORS.warning}10`,
    shadowColor: COLORS.warning,
    shadowOpacity: 0.30,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  statCardCyan: {
    borderColor: `${COLORS.primary}60`,
    backgroundColor: COLORS.primaryDim,
    ...SHADOWS.glowCyanSoft,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Weekly summary
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.purple}40`,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.20,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  weekStatItem: { alignItems: 'center', gap: 2 },
  weekStatValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  weekStatLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  weekDivider: { width: 1, height: 32, backgroundColor: `${COLORS.purple}40` },

  // Section titles
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },

  // Projects
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.magenta}40`,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.magenta,
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  projectTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: 0.3,
  },
  projectPct: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  projectMeta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Empty
  separator: { height: 10 },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    letterSpacing: 0.3,
  },
});
