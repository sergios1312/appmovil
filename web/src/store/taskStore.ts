/**
 * @file taskStore.ts — Web task store with Supabase sync + Realtime
 *
 * - Repositorio: SupabaseTaskRepository (PostgreSQL remoto)
 * - Realtime: suscripción WebSocket para recibir cambios de la app móvil al instante,
 *   con reconexión automática si el canal cae.
 * - La carga inicial y el procesado de rutinas están separados y se coordinan
 *   desde App (useRealtimeSync) para evitar reentradas y carreras.
 */

import { create } from 'zustand';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { SupabaseTaskRepository } from '@/data/SupabaseTaskRepository';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { localDayKey } from '@/utils/dateHelpers';

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';
export type TaskTypeFilter = 'all' | 'routine' | 'single' | 'project' | 'habit_group';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  activeTypeFilter: TaskTypeFilter;

  loadTasks: () => Promise<void>;
  processRoutines: () => Promise<void>;
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

/** Estado que DEBERÍA tener un grupo de hábitos según sus hijos (o null si no aplica). */
function expectedGroupStatus(group: Task, all: Task[]): Task['status'] | null {
  if (group.task_type !== 'habit_group') return null;
  const children = all.filter((t) => t.parent_id === group.id);
  if (children.length === 0) return null;
  return children.every((c) => c.status === 'completed') ? 'completed' : 'pending';
}

/**
 * Persiste en BD el estado correcto de los grupos de hábitos cuyo estado no
 * concuerda con sus hijos. Antes esto se mutaba solo en memoria y nunca se
 * guardaba → grupos desincronizados entre dispositivos. Retorna true si cambió.
 */
async function reconcileHabitGroups(
  tasks: Task[],
  repo: SupabaseTaskRepository
): Promise<boolean> {
  let changed = false;
  for (const group of tasks.filter((t) => t.task_type === 'habit_group')) {
    const should = expectedGroupStatus(group, tasks);
    if (should && group.status !== should) {
      await repo.update({ id: group.id, status: should });
      changed = true;
    }
  }
  return changed;
}

// Referencia al canal de Realtime para poder desuscribirse.
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
// Evita que processDailyRoutines se ejecute en paralelo consigo mismo.
let isProcessingRoutines = false;

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
      set({ tasks, isLoading: false });

      // Reparar grupos de hábitos descuadrados (persistiendo en BD).
      const changed = await reconcileHabitGroups(tasks, repo);
      if (changed) {
        set({ tasks: await repo.getAll(true) });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  /**
   * Procesa las rutinas diarias (crea las de hoy, borra atrasadas). Separado de
   * loadTasks y protegido con un flag para que no se ejecute en paralelo ni en
   * cada navegación de página (antes corría en cada loadTasks → duplicados/carreras).
   */
  processRoutines: async () => {
    if (isProcessingRoutines) return;
    isProcessingRoutines = true;
    try {
      const { processDailyRoutines } = await import('@/utils/recurrence');
      const madeChanges = await processDailyRoutines(
        get().tasks,
        get().addTask,
        get().updateTask,
        get().deleteTask
      );
      if (madeChanges) {
        set({ tasks: await getRepo().getAll(true) });
      }
    } catch (err) {
      set({ error: String(err) });
    } finally {
      isProcessingRoutines = false;
    }
  },

  addTask: async (dto) => {
    try {
      const repo = getRepo();
      const newTask = await repo.create(dto);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
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
        tasks: state.tasks.map((t) => (t.id === dto.id ? updated : t)),
      }));

      // Si la tarea pertenece a un grupo de hábitos, persistir el estado del grupo
      // (completar cuando todos los hijos están listos; reabrir si se reabre uno).
      if (updated.parent_id) {
        const parent = get().tasks.find((t) => t.id === updated.parent_id);
        if (parent) {
          const should = expectedGroupStatus(parent, get().tasks);
          if (should && parent.status !== should) {
            const updatedParent = await repo.update({ id: parent.id, status: should });
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === parent.id ? updatedParent : t)),
            }));
          }
        }
      }
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteTask: async (id) => {
    try {
      const repo = getRepo();
      // Borrado en cascada recursivo (nietos incluidos), de hojas hacia la raíz,
      // para no depender de ON DELETE CASCADE y no dejar tareas huérfanas.
      const descendants = getDescendants(get().tasks, id);
      for (const d of [...descendants].reverse()) await repo.delete(d.id);
      await repo.delete(id);

      const removed = new Set<string>([id, ...descendants.map((t) => t.id)]);
      set((state) => ({
        tasks: state.tasks.filter((t) => !removed.has(t.id)),
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

    // Evitar doble suscripción.
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
              // Evitar duplicados (puede ya existir si se creó desde esta misma app).
              if (state.tasks.some((t) => t.id === newTask.id)) return state;
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
            set((state) => {
              const removed = new Set<string>([
                deletedId,
                ...getDescendants(state.tasks, deletedId).map((t) => t.id),
              ]);
              return { tasks: state.tasks.filter((t) => !removed.has(t.id)) };
            });
          }
        }
      )
      .subscribe((status) => {
        // Si el canal falla, reconectar para que la sync con la app móvil no
        // quede muerta en silencio. (CLOSED se ignora: ocurre al desuscribir.)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
          setTimeout(() => {
            if (!realtimeChannel && useAuthStore.getState().user) {
              get().subscribeToRealtime();
            }
          }, 3000);
        }
      });
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
    completed_at: (row.completed_at as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ─── Selectores derivados ─────────────────────────────────────────────────────

export const selectFilteredTasks = (state: TaskStore): Task[] => {
  let rootTasks = state.tasks.filter((t) => !t.parent_id);
  const today = localDayKey(); // YYYY-MM-DD local

  if (state.activeTypeFilter !== 'all') {
    rootTasks = rootTasks.filter((t) => t.task_type === state.activeTypeFilter);
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
  const today = localDayKey(); // YYYY-MM-DD local
  const todayTasks = state.tasks.filter((t) => t.due_date?.startsWith(today));
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'completed').length;
  const urgent = todayTasks.filter((t) => t.priority === 'urgent').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, urgent, progress };
};

/**
 * Progreso de gamificación semanal, basado en `completed_at` (no en updated_at,
 * que cambia con cualquier edición y contaminaba el cálculo).
 */
export const selectWeeklyProgress = (state: TaskStore) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekTasks = state.tasks.filter((t) => {
    if (t.status !== 'completed' || !t.completed_at) return false;
    return new Date(t.completed_at) >= startOfWeek;
  });

  const totalWeight = weekTasks.reduce((acc, t) => acc + (t.weight || 3), 0);
  const totalCompleted = weekTasks.length;

  const milestones = [10, 25, 50, 75, 100, 150];
  const currentMilestone = milestones.find((m) => totalWeight < m) ?? milestones[milestones.length - 1];
  const progress = Math.min(Math.round((totalWeight / currentMilestone) * 100), 100);
  const remaining = Math.max(currentMilestone - totalWeight, 0);

  return { totalWeight, totalCompleted, currentMilestone, progress, remaining };
};

/**
 * Gets project-type root tasks with progress info.
 */
export const selectProjects = (state: TaskStore) => {
  const projects = state.tasks.filter((t) => !t.parent_id && t.task_type === 'project');

  return projects.map((project) => {
    const allDescendants = getDescendants(state.tasks, project.id);
    const total = allDescendants.length;
    const completed = allDescendants.filter((t) => t.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { ...project, totalSubtasks: total, completedSubtasks: completed, progress };
  });
};

function getDescendants(tasks: Task[], parentId: string): Task[] {
  const children = tasks.filter((t) => t.parent_id === parentId);
  let all = [...children];
  for (const child of children) {
    all = [...all, ...getDescendants(tasks, child.id)];
  }
  return all;
}
