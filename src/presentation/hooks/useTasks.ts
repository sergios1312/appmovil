import { useEffect } from 'react';
import {
  useTaskStore,
  selectFilteredTasks,
  selectTodayStats,
  TaskFilter,
} from '@/presentation/store/taskStore';
import { CreateTaskDTO } from '@/core/entities/Task';

export function useTasks() {
  const {
    tasks,
    isLoading,
    error,
    activeFilter,
    selectedTaskId,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter,
    selectTask,
    clearError,
  } = useTaskStore();

  // Carga inicial al montar el hook
  useEffect(() => {
    loadTasks();
  }, []);

  // Datos derivados via selectores
  const filteredTasks = useTaskStore(selectFilteredTasks);
  const todayStats = useTaskStore(selectTodayStats);

  return {
    // Datos
    tasks,
    filteredTasks,
    todayStats,
    isLoading,
    error,
    activeFilter,
    selectedTaskId,

    // Acciones
    createTask: (input: CreateTaskDTO) => addTask(input),
    updateTask,
    deleteTask,
    toggleComplete,
    setFilter: (f: TaskFilter) => setFilter(f),
    selectTask,
    refresh: () => loadTasks(),
    clearError,
  };
}
