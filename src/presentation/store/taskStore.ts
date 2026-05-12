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
 *
 * VISTAS TEMPORALES:
 * - daily: todas las tareas + subtareas del día (repetitivas + únicas)
 * - weekly: tareas de la semana, solo raíz (sin subtareas)
 * - monthly: solo tareas únicas/proyectos (oculta rutinas), sin subtareas
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
import {
  type ViewMode,
  type MaterializedTask,
  getTasksForView,
  getDailyView,
  getWeeklyView,
  getMonthlyView,
  getTasksForWeek,
  getTasksForMonth,
  getTodayStatsWithRecurrence,
  isRecurringTask,
  isRootTask,
  getDateKey,
} from '@/utils/taskFilters';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  selectedTaskId: string | null;
  notificationIds: Record<string, string>;

  /** Vista temporal activa: daily | weekly | monthly */
  viewMode: ViewMode;

  /** Fecha de referencia para navegación temporal (ISO string) */
  referenceDate: string;

  // Carga
  loadTasks: () => Promise<void>;

  // CRUD
  addTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string, effectiveDate?: string) => Promise<void>;

  // Subtareas
  getSubtasks: (parentId: string) => Task[];

  // UI
  setFilter: (filter: TaskFilter) => void;
  selectTask: (id: string | null) => void;
  clearError: () => void;

  // Vistas temporales
  setViewMode: (mode: ViewMode) => void;
  setReferenceDate: (date: string) => void;
  goToToday: () => void;

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
  viewMode: 'daily' as ViewMode,
  referenceDate: new Date().toISOString(),

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

  toggleComplete: async (id, effectiveDate?: string) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const isRecurring = isRecurringTask(task);

    if (isRecurring) {
      // Para tareas rutinarias: el estado "completado" se ancla a la fecha del día.
      // Si ya está completada HOY (same due_date), pasar a pending (limpiar due_date).
      // Si está pending o fue completada otro día, marcarla completada para HOY.
      const todayKey = getDateKey(new Date());
      const currentDueKey = task.due_date ? getDateKey(new Date(task.due_date)) : null;
      const isCompletedToday = task.status === 'completed' && currentDueKey === todayKey;

      if (isCompletedToday) {
        // Desmarcar: volver a pendiente, limpiar due_date en BD
        await get().updateTask({ id, status: 'pending', due_date: null });
      } else {
        // Completar la instancia de HOY: grabar due_date = hoy (inicio del día)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        await get().updateTask({
          id,
          status: 'completed',
          due_date: todayStart.toISOString(),
        });
      }
    } else {
      // Tarea única: toggle normal sin tocar due_date
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await get().updateTask({ id, status: newStatus });
    }
  },


  getSubtasks: (parentId) => get().tasks.filter((t) => t.parent_id === parentId),

  setFilter: (filter) => set({ activeFilter: filter }),
  selectTask: (id) => set({ selectedTaskId: id }),
  clearError: () => set({ error: null }),

  // ─── Vistas temporales ──────────────────────────────────────────────────────
  setViewMode: (mode) => set({ viewMode: mode }),
  setReferenceDate: (date) => set({ referenceDate: date }),
  goToToday: () => set({ referenceDate: new Date().toISOString() }),

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

/** Devuelve las tareas según el filtro activo (legacy, compatible con filtros simples) */
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

// ─── Selectores con recurrencia ───────────────────────────────────────────────

/**
 * Selector de vista temporal con resolución de recurrencia.
 * Retorna tareas materializadas según la vista activa (daily/weekly/monthly).
 */
export const selectViewTasks = (state: TaskStore): MaterializedTask[] => {
  const refDate = new Date(state.referenceDate);
  return getTasksForView(state.tasks, state.viewMode, refDate);
};

/**
 * Selector de vista diaria: tareas + subtareas del día de referencia.
 */
export const selectDailyTasks = (state: TaskStore): MaterializedTask[] => {
  const refDate = new Date(state.referenceDate);
  return getDailyView(state.tasks, refDate);
};

/**
 * Selector de vista semanal: tareas raíz de la semana (sin subtareas).
 */
export const selectWeeklyTasks = (state: TaskStore): MaterializedTask[] => {
  const refDate = new Date(state.referenceDate);
  return getWeeklyView(state.tasks, refDate);
};

/**
 * Selector de vista mensual: solo tareas únicas/proyectos (sin rutinas).
 */
export const selectMonthlyTasks = (state: TaskStore): MaterializedTask[] => {
  const refDate = new Date(state.referenceDate);
  return getMonthlyView(state.tasks, refDate);
};

/**
 * Selector de tareas agrupadas por fecha para la semana.
 */
export const selectWeeklyGrouped = (state: TaskStore) => {
  const refDate = new Date(state.referenceDate);
  return getTasksForWeek(state.tasks, refDate);
};

/**
 * Selector de tareas agrupadas por fecha para el mes.
 */
export const selectMonthlyGrouped = (state: TaskStore) => {
  const refDate = new Date(state.referenceDate);
  return getTasksForMonth(state.tasks, refDate);
};

/**
 * Estadísticas del día para el dashboard, CON recurrencia.
 * Las tareas repetitivas que corresponden a hoy cuentan como pendientes.
 */
export const selectTodayStats = (state: TaskStore) => {
  const stats = getTodayStatsWithRecurrence(state.tasks);
  const urgent = getDailyView(state.tasks, new Date())
    .filter(t => isRootTask(t) && t.priority === 'urgent').length;
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return {
    total: stats.total,
    completed: stats.completed,
    pending: stats.pending,
    urgent,
    progress,
    routines: stats.routines,
    singles: stats.singles,
  };
};

// Re-export para uso en otros archivos
export type { ViewMode, MaterializedTask };
