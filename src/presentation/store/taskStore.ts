/**
 * @file taskStore.ts
 * @layer presentation/store
 * @description Store de Zustand para gestión de tareas con Supabase + Realtime.
 *
 * MIGRACIÓN: SQLite + Google Tasks → Supabase (PostgreSQL remoto)
 * - El repositorio ahora es SupabaseTaskRepository
 * - Realtime: suscripción WebSocket para recibir cambios de la web al instante
 * - Se eliminó toda la lógica de Google Tasks sync
 * - Se mantienen notificaciones locales
 */

import { create } from 'zustand';
import {
  cancelScheduledNotification,
  scheduleTaskDueNotification,
} from '@/infrastructure/services/notifications';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { SupabaseTaskRepository } from '@/data/repositories/SupabaseTaskRepository';
import { supabase } from '@/infrastructure/database/supabase';
import { useAuthStore } from '@/presentation/store/authStore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  selectedTaskId: string | null;
  notificationIds: Record<string, string>;

  // Carga
  loadTasks: () => Promise<void>;

  // CRUD
  addTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;

  // Subtareas
  getSubtasks: (parentId: string) => Task[];

  // UI
  setFilter: (filter: TaskFilter) => void;
  selectTask: (id: string | null) => void;
  clearError: () => void;

  // Realtime
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

/**
 * Obtiene el repositorio con el userId actual.
 */
function getRepo(): SupabaseTaskRepository {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('No hay usuario autenticado');
  return new SupabaseTaskRepository(user.id);
}

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

// Referencia al canal de Realtime para poder desuscribirse
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'all',
  selectedTaskId: null,
  notificationIds: {},

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const repo = getRepo();
      const tasks = await repo.getAll(true);
      set({ tasks, isLoading: false });
    } catch (err) {
      console.error('[TaskStore] loadTasks:', err);
      set({ error: String(err), isLoading: false });
    }
  },

  addTask: async (dto) => {
    try {
      const repo = getRepo();
      const newTask = await repo.create(dto);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));

      // Notificación local
      void (async () => {
        const notifId = await scheduleTaskDueNotification(newTask);
        if (notifId) {
          set((state) => ({
            notificationIds: { ...state.notificationIds, [newTask.id]: notifId },
          }));
        }
      })();

      return newTask;
    } catch (err) {
      console.error('[TaskStore] addTask:', err);
      set({ error: String(err) });
      throw err;
    }
  },

  updateTask: async (dto) => {
    try {
      const repo = getRepo();
      const updated = await repo.update(dto);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === dto.id ? updated : t)),
      }));

      // Reprogramar notificación
      void (async () => {
        const currentNotifId = get().notificationIds[dto.id];
        if (currentNotifId) await cancelScheduledNotification(currentNotifId);
        const newNotifId = await scheduleTaskDueNotification(updated);
        set((state) => {
          const next = { ...state.notificationIds };
          if (newNotifId) next[dto.id] = newNotifId;
          else delete next[dto.id];
          return { notificationIds: next };
        });
      })();
    } catch (err) {
      console.error('[TaskStore] updateTask:', err);
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

      const notifId = get().notificationIds[id];
      if (notifId) void cancelScheduledNotification(notifId);
    } catch (err) {
      console.error('[TaskStore] deleteTask:', err);
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
  selectTask: (id) => set({ selectedTaskId: id }),
  clearError: () => set({ error: null }),

  // ─── Realtime ──────────────────────────────────────────────────────────────

  subscribeToRealtime: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Evitar doble suscripción
    if (realtimeChannel) return;

    realtimeChannel = supabase
      .channel('tasks-realtime-mobile')
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
              if (state.tasks.some(t => t.id === newTask.id)) return state;
              return { tasks: [mapPayloadToTask(newTask), ...state.tasks] };
            });
          }

          if (eventType === 'UPDATE') {
            const updatedTask = payload.new as Record<string, unknown>;
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === updatedTask.id ? mapPayloadToTask(updatedTask) : t
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

// ─── Selectores derivados ─────────────────────────────────────────────────────

/** Devuelve las tareas según el filtro activo */
export const selectFilteredTasks = (state: TaskStore): Task[] => {
  const rootTasks = state.tasks.filter((t) => !t.parent_id);
  const today = new Date().toISOString().split('T')[0];

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

/** Estadísticas del día para el dashboard */
export const selectTodayStats = (state: TaskStore) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter((t) => t.due_date?.startsWith(today));
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'completed').length;
  const urgent = todayTasks.filter((t) => t.priority === 'urgent').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, urgent, progress };
};
