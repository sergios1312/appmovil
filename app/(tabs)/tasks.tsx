import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTasks } from '@/presentation/hooks/useTasks';
import TaskItem from '@/presentation/components/TaskItem';
import { TaskFilter } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import type { ViewMode, MaterializedTask } from '@/utils/taskFilters';
import { isRootTask } from '@/utils/taskFilters';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '@/core/entities/Task';

// ─── Configuración de vistas ──────────────────────────────────────────────────

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'daily',   label: 'Día',     icon: 'today-outline' },
  { key: 'weekly',  label: 'Semana',  icon: 'calendar-outline' },
  { key: 'monthly', label: 'Mes',     icon: 'grid-outline' },
];

const FILTERS: { key: TaskFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'all',       label: 'Todas',      icon: 'grid-outline' },
  { key: 'pending',   label: 'Activas',    icon: 'compass-outline' },
  { key: 'completed', label: 'Completas',  icon: 'trophy-outline' },
];

// ─── Helpers de fecha para navegación ─────────────────────────────────────────

function navigateDate(current: string, viewMode: ViewMode, direction: 'prev' | 'next'): string {
  const date = new Date(current);
  switch (viewMode) {
    case 'daily':
      return (direction === 'next' ? addDays(date, 1) : subDays(date, 1)).toISOString();
    case 'weekly':
      return (direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1)).toISOString();
    case 'monthly':
      return (direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)).toISOString();
  }
}

function formatReferenceDate(isoDate: string, viewMode: ViewMode): string {
  const date = new Date(isoDate);
  switch (viewMode) {
    case 'daily':
      return format(date, "EEEE, d 'de' MMMM", { locale: es });
    case 'weekly': {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM', { locale: es })}`;
    }
    case 'monthly':
      return format(date, "MMMM yyyy", { locale: es });
  }
}

export default function TasksScreen() {
  const router = useRouter();
  const {
    viewMode,
    referenceDate,
    viewTasks,
    dailyTasks,
    weeklyTasks,
    monthlyTasks,
    activeFilter,
    setFilter,
    toggleComplete,
    isLoading,
    refresh,
    setViewMode,
    setReferenceDate,
    goToToday,
    tasks,
  } = useTasks();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar tareas según la vista activa
  const displayTasks = useMemo(() => {
    let filtered: MaterializedTask[];

    switch (viewMode) {
      case 'daily':
        // Vista diaria: tareas + subtareas
        filtered = dailyTasks;
        break;
      case 'weekly':
        // Vista semanal: solo tareas raíz (sin subtareas)
        filtered = weeklyTasks;
        break;
      case 'monthly':
        // Vista mensual: solo tareas únicas (sin rutinas ni subtareas)
        filtered = monthlyTasks;
        break;
      default:
        filtered = viewTasks;
    }

    // Aplicar filtro de estado
    switch (activeFilter) {
      case 'pending':
        return filtered.filter(t => t.status === 'pending' || t.status === 'in_progress');
      case 'completed':
        return filtered.filter(t => t.status === 'completed');
      case 'all':
      default:
        return filtered;
    }
  }, [viewMode, dailyTasks, weeklyTasks, monthlyTasks, viewTasks, activeFilter]);

  // Agrupar por fecha para vistas semanales/mensuales
  const sections = useMemo(() => {
    if (viewMode === 'daily') return null;

    const grouped: Record<string, MaterializedTask[]> = {};
    for (const task of displayTasks) {
      const key = task.effective_date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, items]) => ({
        title: format(new Date(dateKey + 'T12:00:00'), "EEEE d 'de' MMM", { locale: es }),
        data: items,
        dateKey,
      }));
  }, [viewMode, displayTasks]);

  const handlePressTask = (task: Task) => {
    router.push({ pathname: '/task/[id]', params: { id: task.id } });
  };

  // Conteo de tareas con hint de recurrencia
  const taskCount = displayTasks.length;
  const routineCount = displayTasks.filter(t => (t as MaterializedTask).is_recurrence_instance).length;
  const singleCount = taskCount - routineCount;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.appLabel}>MISIONES</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>Tablero de Misiones</Text>
        <Text style={styles.subtitle}>{taskCount} misiones en el radar</Text>
      </View>

      {/* Selector de vista temporal */}
      <View style={styles.viewModeRow}>
        {VIEW_MODES.map((vm) => (
          <TouchableOpacity
            key={vm.key}
            style={[styles.viewModeChip, viewMode === vm.key && styles.viewModeChipActive]}
            onPress={() => setViewMode(vm.key)}
          >
            <Ionicons
              name={vm.icon}
              size={14}
              color={viewMode === vm.key ? COLORS.textInverse : COLORS.textMuted}
            />
            <Text style={[styles.viewModeLabel, viewMode === vm.key && styles.viewModeLabelActive]}>
              {vm.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navegación de fecha */}
      <View style={styles.dateNavRow}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => setReferenceDate(navigateDate(referenceDate, viewMode, 'prev'))}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.dateNavCenter}>
          <Text style={styles.dateNavText}>
            {formatReferenceDate(referenceDate, viewMode)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => setReferenceDate(navigateDate(referenceDate, viewMode, 'next'))}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Info badge para vista mensual */}
      {viewMode === 'monthly' && (
        <View style={styles.infoBar}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
          <Text style={styles.infoBarText}>
            Las rutinas diarias están ocultas en esta vista
          </Text>
        </View>
      )}

      {/* Filtros de estado */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon}
              size={12}
              color={activeFilter === f.key ? COLORS.textInverse : COLORS.textMuted}
            />
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de tareas */}
      {viewMode === 'daily' ? (
        // Vista diaria: lista plana con tareas + subtareas
        <FlatList
          data={displayTasks}
          keyExtractor={(item, index) => `${item.id}-${(item as MaterializedTask).effective_date}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => {
            const mTask = item as MaterializedTask;
            const isSubtask = !!item.parent_id;
            return (
              <View style={isSubtask ? styles.subtaskIndent : undefined}>
                {mTask.is_recurrence_instance && isRootTask(item) && (
                  <View style={styles.recurrenceBadge}>
                    <Ionicons name="repeat-outline" size={10} color={COLORS.primary} />
                    <Text style={styles.recurrenceText}>Rutina</Text>
                  </View>
                )}
                <TaskItem
                  task={item}
                  onPress={handlePressTask}
                />
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={52} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Zona despejada</Text>
              <Text style={styles.emptyText}>
                No hay misiones para este día
              </Text>
            </View>
          }
        />
      ) : (
        // Vista semanal/mensual: agrupado por fecha
        <SectionList
          sections={sections ?? []}
          keyExtractor={(item, index) => `${item.id}-${(item as MaterializedTask).effective_date}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => {
            const mTask = item as MaterializedTask;
            return (
              <View>
                {mTask.is_recurrence_instance && (
                  <View style={styles.recurrenceBadge}>
                    <Ionicons name="repeat-outline" size={10} color={COLORS.primary} />
                    <Text style={styles.recurrenceText}>Rutina</Text>
                  </View>
                )}
                <TaskItem
                  task={item}
                  onPress={handlePressTask}
                />
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={52} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Zona despejada</Text>
              <Text style={styles.emptyText}>
                No hay misiones{viewMode === 'monthly' ? ' únicas ' : ' '}
                para este período
              </Text>
              {viewMode === 'monthly' && (
                <Text style={styles.emptyHint}>
                  Las rutinas diarias se ocultan en la vista mensual
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  timeText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },

  // Vista temporal selector
  viewModeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  viewModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewModeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glowCyan,
  },
  viewModeLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewModeLabelActive: {
    color: COLORS.textInverse,
  },

  // Navegación de fecha
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavCenter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dateNavText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },

  // Info bar (mensual)
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.info}12`,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  infoBarText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.info,
    fontWeight: '600',
  },

  // Filtros
  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glowCyan,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  filterLabelActive: {
    color: COLORS.textInverse,
  },

  // Lista
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.huge },

  // Subtask indent
  subtaskIndent: {
    marginLeft: SPACING.xl,
  },

  // Recurrence badge
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  recurrenceText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Section headers (semanal/mensual)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  sectionBadge: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: SPACING.huge, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted, textAlign: 'center' },
  emptyHint: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.info,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
