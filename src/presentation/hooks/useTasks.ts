import { useEffect } from 'react';
import {
  useTaskStore,
  selectFilteredTasks,
  selectTodayStats,
  selectViewTasks,
  selectDailyTasks,
  selectWeeklyTasks,
  selectMonthlyTasks,
  selectWeeklyGrouped,
  selectMonthlyGrouped,
  TaskFilter,
} from '@/presentation/store/taskStore';
import { CreateTaskDTO } from '@/core/entities/Task';
import type { ViewMode, MaterializedTask } from '@/utils/taskFilters';

export function useTasks() {
  const {
    tasks,
    isLoading,
    error,
    activeFilter,
    selectedTaskId,
    viewMode,
    referenceDate,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter,
    selectTask,
    clearError,
    setViewMode,
    setReferenceDate,
    goToToday,
  } = useTaskStore();

  // Carga inicial al montar el hook
  useEffect(() => {
    loadTasks();
  }, []);

  // Datos derivados via selectores
  const filteredTasks = useTaskStore(selectFilteredTasks);
  const todayStats = useTaskStore(selectTodayStats);

  // Selectores con recurrencia (vistas temporales)
  const viewTasks = useTaskStore(selectViewTasks);
  const dailyTasks = useTaskStore(selectDailyTasks);
  const weeklyTasks = useTaskStore(selectWeeklyTasks);
  const monthlyTasks = useTaskStore(selectMonthlyTasks);
  const weeklyGrouped = useTaskStore(selectWeeklyGrouped);
  const monthlyGrouped = useTaskStore(selectMonthlyGrouped);

  return {
    // Datos
    tasks,
    filteredTasks,
    todayStats,
    isLoading,
    error,
    activeFilter,
    selectedTaskId,

    // Vistas temporales con recurrencia
    viewMode,
    referenceDate,
    viewTasks,
    dailyTasks,
    weeklyTasks,
    monthlyTasks,
    weeklyGrouped,
    monthlyGrouped,

    // Acciones
    createTask: (input: CreateTaskDTO) => addTask(input),
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter: (f: TaskFilter) => setFilter(f),
    selectTask,
    refresh: () => loadTasks(),
    clearError,

    // Navegación temporal
    setViewMode: (mode: ViewMode) => setViewMode(mode),
    setReferenceDate: (date: string) => setReferenceDate(date),
    goToToday,
  };
}
