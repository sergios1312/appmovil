/**
 * @file taskStore.ts — Web task store with Supabase sync + Realtime
 *
 * MIGRACIÓN: Google Tasks → Supabase
 * - El repositorio ahora es SupabaseTaskRepository (PostgreSQL remoto)
 * - Realtime: suscripción WebSocket para recibir cambios de la app móvil al instante
 * - Se eliminó toda la lógica de Google Tasks sync
 */

import { create } from 'zustand';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { SupabaseTaskRepository } from '@/data/SupabaseTaskRepository';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';
export type TaskTypeFilter = 'all' | 'routine' | 'single' | 'project' | 'habit_group';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  activeTypeFilter: TaskTypeFilter;

  loadTasks: () => Promise<void>;
  addTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  getSubtasks: (parentId: string) => Task[];
  setFilter: (filter: TaskFilter) => void;
  setTypeFilter: (filter: TaskTypeFilter) => void;
  clearError: () => void;

  // Realtime
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

/**
 * Obtiene el repositorio de tareas con el userId actual.
 * Si no hay usuario autenticado, lanza un error.
 */
function getRepo(): SupabaseTaskRepository {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('No hay usuario autenticado');
  return new SupabaseTaskRepository(user.id);
}

/**
 * Auto-completes habit_group parents when all children are completed
 */
function autoCompleteHabitGroups(tasks: Task[]): Task[] {
  const updated = [...tasks];
  const groups = updated.filter(t => t.task_type === 'habit_group' && t.status !== 'completed');
  for (const group of groups) {
    const children = updated.filter(t => t.parent_id === group.id);
    if (children.length > 0 && children.every(c => c.status === 'completed')) {
      const idx = updated.findIndex(t => t.id === group.id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], status: 'completed', updated_at: new Date().toISOString() };
      }
    }
  }
  return updated;
}

// Referencia al canal de Realtime para poder desuscribirse
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'all',
  activeTypeFilter: 'all',

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const repo = getRepo();
      const tasks = await repo.getAll(true);
      set({ tasks: autoCompleteHabitGroups(tasks), isLoading: false });
      
      // Procesar rutinas diarias atrasadas
      import('@/utils/recurrence').then(({ processDailyRoutines }) => {
        processDailyRoutines(get().tasks, get().addTask, get().updateTask);
      });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addTask: async (dto) => {
    try {
      const repo = getRepo();
      const newTask = await repo.create(dto);
      set((state) => ({ tasks: autoCompleteHabitGroups([newTask, ...state.tasks]) }));
      return newTask;
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  updateTask: async (dto) => {
    try {
      const repo = getRepo();
      const updated = await repo.update(dto);
      set((state) => ({
        tasks: autoCompleteHabitGroups(
          state.tasks.map((t) => (t.id === dto.id ? updated : t))
        ),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteTask: async (id) => {
    try {
      const repo = getRepo();
      await repo.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id && t.parent_id !== id),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await get().updateTask({ id, status: newStatus });
  },

  getSubtasks: (parentId) => get().tasks.filter((t) => t.parent_id === parentId),
  setFilter: (filter) => set({ activeFilter: filter }),
  setTypeFilter: (filter) => set({ activeTypeFilter: filter }),
  clearError: () => set({ error: null }),

  // ─── Realtime ──────────────────────────────────────────────────────────────

  subscribeToRealtime: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Evitar doble suscripción
    if (realtimeChannel) return;

    realtimeChannel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { eventType } = payload;

          if (eventType === 'INSERT') {
            const newTask = payload.new as Record<string, unknown>;
            set((state) => {
              // Evitar duplicados (la tarea ya puede estar si fue creada desde esta misma app)
              if (state.tasks.some(t => t.id === newTask.id)) return state;
              return {
                tasks: autoCompleteHabitGroups([mapPayloadToTask(newTask), ...state.tasks]),
              };
            });
          }

          if (eventType === 'UPDATE') {
            const updatedTask = payload.new as Record<string, unknown>;
            set((state) => ({
              tasks: autoCompleteHabitGroups(
                state.tasks.map((t) =>
                  t.id === updatedTask.id ? mapPayloadToTask(updatedTask) : t
                )
              ),
            }));
          }

          if (eventType === 'DELETE') {
            const deletedId = (payload.old as Record<string, unknown>).id as string;
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== deletedId && t.parent_id !== deletedId),
            }));
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromRealtime: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));

/**
 * Mapea un payload de Realtime a la entidad Task.
 */
function mapPayloadToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    parent_id: (row.parent_id as string) || null,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    status: (row.status as Task['status']) || 'pending',
    priority: (row.priority as Task['priority']) || 'medium',
    task_type: (row.task_type as Task['task_type']) || 'single',
    due_date: (row.due_date as string) ?? undefined,
    weight: (row.weight as number) ?? 3,
    repeat_days: (row.repeat_days as number[]) ?? undefined,
    hide_from_calendar: (row.hide_from_calendar as boolean) ?? false,
    tags: (row.tags as string[]) ?? [],
    is_synced: true,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Task;
}

// ─── Selectores derivados ─────────────────────────────────────────────────────

export const selectFilteredTasks = (state: TaskStore): Task[] => {
  let rootTasks = state.tasks.filter((t) => !t.parent_id);
  const today = new Date().toISOString().split('T')[0];

  if (state.activeTypeFilter !== 'all') {
    rootTasks = rootTasks.filter(t => t.task_type === state.activeTypeFilter);
  }

  switch (state.activeFilter) {
    case 'today':
      return rootTasks.filter((t) => t.due_date?.startsWith(today));
    case 'pending':
      return rootTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    case 'completed':
      return rootTasks.filter((t) => t.status === 'completed');
    case 'all':
    default:
      return rootTasks;
  }
};

export const selectTodayStats = (state: TaskStore) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter((t) => t.due_date?.startsWith(today));
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'completed').length;
  const urgent = todayTasks.filter((t) => t.priority === 'urgent').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, urgent, progress };
};

/**
 * Calculates weekly gamification progress based on task weights.
 */
export const selectWeeklyProgress = (state: TaskStore) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekTasks = state.tasks.filter(t => {
    const updated = new Date(t.updated_at);
    return updated >= startOfWeek && t.status === 'completed';
  });

  const totalWeight = weekTasks.reduce((acc, t) => acc + (t.weight || 3), 0);
  const totalCompleted = weekTasks.length;

  const milestones = [10, 25, 50, 75, 100, 150];
  const currentMilestone = milestones.find(m => totalWeight < m) ?? milestones[milestones.length - 1];
  const progress = Math.min(Math.round((totalWeight / currentMilestone) * 100), 100);
  const remaining = Math.max(currentMilestone - totalWeight, 0);

  return { totalWeight, totalCompleted, currentMilestone, progress, remaining };
};

/**
 * Gets project-type root tasks with progress info.
 */
export const selectProjects = (state: TaskStore) => {
  const projects = state.tasks.filter(t => !t.parent_id && t.task_type === 'project');

  return projects.map(project => {
    const allDescendants = getDescendants(state.tasks, project.id);
    const total = allDescendants.length;
    const completed = allDescendants.filter(t => t.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { ...project, totalSubtasks: total, completedSubtasks: completed, progress };
  });
};

function getDescendants(tasks: Task[], parentId: string): Task[] {
  const children = tasks.filter(t => t.parent_id === parentId);
  let all = [...children];
  for (const child of children) {
    all = [...all, ...getDescendants(tasks, child.id)];
  }
  return all;
}
