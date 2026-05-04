/**
 * @file useTasks.ts
 * @layer presentation/hooks
 * @description Hook de React que conecta la UI con el taskStore.
 * Encapsula la lógica de carga inicial y expone datos ya procesados.
 */

import { useEffect } from 'react';
import { useTaskStore, selectFilteredTasks, selectTodayStats, TaskFilter } from '@/infrastructure/store/taskStore';
import { CreateTaskInput } from '@/core/use-cases/CreateTaskUseCase';

export function useTasks() {
  const {
    todayTasks,
    allRootTasks,
    isLoading,
    error,
    activeFilter,
    loadTodayTasks,
    loadAllTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter,
    selectTask,
    selectedTaskId,
    clearError,
  } = useTaskStore();

  // Carga inicial de tareas al montar el hook
  useEffect(() => {
    loadTodayTasks();
    loadAllTasks();
  }, []);

  // Datos derivados
  const filteredTasks = useTaskStore(selectFilteredTasks);
  const todayStats = useTaskStore(selectTodayStats);

  return {
    // Datos
    todayTasks,
    allRootTasks,
    filteredTasks,
    todayStats,
    isLoading,
    error,
    activeFilter,
    selectedTaskId,

    // Acciones
    createTask: async (input: CreateTaskInput) => createTask(input),
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter: (f: TaskFilter) => setFilter(f),
    selectTask,
    refresh: async () => {
      await loadTodayTasks();
      await loadAllTasks();
    },
    clearError,
  };
}
