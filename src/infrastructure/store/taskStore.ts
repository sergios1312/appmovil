/**
 * @file taskStore.ts
 * @layer infrastructure/store
 * @description Store de Zustand para gestión de estado de tareas.
 *
 * Arquitectura del store:
 * - Estado: lista plana de tareas (sin anidamiento)
 * - Acciones: CRUD + sincronización + filtros
 * - La UI accede a datos ya calculados (selectores derivados)
 *
 * Decisión: un store por dominio (tasks / auth) en lugar de un store global.
 * Permite reemplazar cada store independientemente.
 */

import { create } from 'zustand';
import { Task, TaskWithChildrenMeta, UpdateTaskDTO } from '@/core/entities/Task';
import { taskRepository } from '@/data/repositories/TaskRepository';
import { GetTasksUseCase } from '@/core/use-cases/GetTasksUseCase';
import { CreateTaskUseCase, CreateTaskInput } from '@/core/use-cases/CreateTaskUseCase';
import { UpdateTaskUseCase } from '@/core/use-cases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '@/core/use-cases/DeleteTaskUseCase';

// Instanciar use cases con el repositorio (DI manual)
const getTasksUC = new GetTasksUseCase(taskRepository);
const createTaskUC = new CreateTaskUseCase(taskRepository);
const updateTaskUC = new UpdateTaskUseCase(taskRepository);
const deleteTaskUC = new DeleteTaskUseCase(taskRepository);

// ─── Tipos del Store ──────────────────────────────────────────────────────────

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';

interface TaskState {
  // Estado
  tasks: Task[];
  todayTasks: TaskWithChildrenMeta[];
  allRootTasks: TaskWithChildrenMeta[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  selectedTaskId: string | null;

  // Acciones de carga
  loadTodayTasks: () => Promise<void>;
  loadAllTasks: () => Promise<void>;

  // CRUD
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<UpdateTaskDTO>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;

  // UI
  setFilter: (filter: TaskFilter) => void;
  selectTask: (id: string | null) => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskState>((set, get) => ({
  // Estado inicial
  tasks: [],
  todayTasks: [],
  allRootTasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'today',
  selectedTaskId: null,

  // ── Carga ──────────────────────────────────────────────────────────────────

  loadTodayTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayTasks = await getTasksUC.getTodayTasks();
      set({ todayTasks, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  loadAllTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const allRootTasks = await getTasksUC.getAllRootTasks(true);
      set({ allRootTasks, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  createTask: async (input: CreateTaskInput) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await createTaskUC.execute(input);
      // Recargar después de crear
      await get().loadTodayTasks();
      await get().loadAllTasks();
      set({ isLoading: false });
      return newTask;
    } catch (err) {
      set({ error: String(err), isLoading: false });
      return null;
    }
  },

  updateTask: async (id: string, updates: Partial<UpdateTaskDTO>) => {
    set({ error: null });
    try {
      await updateTaskUC.execute({ id, ...updates });
      await get().loadTodayTasks();
      await get().loadAllTasks();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null });
    try {
      await deleteTaskUC.execute(id);
      await get().loadTodayTasks();
      await get().loadAllTasks();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  toggleComplete: async (id: string) => {
    set({ error: null });
    try {
      await updateTaskUC.toggleComplete(id);
      await get().loadTodayTasks();
      await get().loadAllTasks();
    } catch (err) {
      set({ error: String(err) });
    }
  },

  // ── UI ─────────────────────────────────────────────────────────────────────

  setFilter: (filter: TaskFilter) => set({ activeFilter: filter }),
  selectTask: (id: string | null) => set({ selectedTaskId: id }),
  clearError: () => set({ error: null }),
}));

// ─── Selectores derivados ─────────────────────────────────────────────────────

/**
 * Selector: tareas filtradas según el filtro activo
 * Usar dentro de componentes para evitar re-renders innecesarios
 */
export const selectFilteredTasks = (state: TaskState): TaskWithChildrenMeta[] => {
  switch (state.activeFilter) {
    case 'today':
      return state.todayTasks;
    case 'pending':
      return state.allRootTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    case 'completed':
      return state.allRootTasks.filter(t => t.status === 'completed');
    case 'all':
    default:
      return state.allRootTasks;
  }
};

/**
 * Selector: estadísticas del día
 */
export const selectTodayStats = (state: TaskState) => {
  const total = state.todayTasks.length;
  const completed = state.todayTasks.filter(t => t.status === 'completed').length;
  const urgent = state.todayTasks.filter(t => t.priority === 'urgent').length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, urgent, progress };
};
