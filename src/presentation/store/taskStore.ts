import { create } from 'zustand';
import {
  cancelScheduledNotification,
  scheduleTaskDueNotification,
} from '@/infrastructure/services/notifications';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { taskRepository } from '@/data/repositories/TaskRepository';
import { useAuthStore } from '@/presentation/store/authStore';
import {
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  fetchGoogleTaskLists,
  fetchGoogleTasks,
} from '@/infrastructure/services/googleTasks';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  selectedTaskId: string | null;
  notificationIds: Record<string, string>;
  defaultTaskListId: string | null;

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
  syncWithGoogle: () => Promise<void>;
}

// Función auxiliar para obtener/cachear el ID de la lista principal de Google Tasks
async function getDefaultTaskListId(accessToken: string): Promise<string | null> {
  try {
    const lists = await fetchGoogleTaskLists(accessToken);
    if (lists && lists.length > 0) {
      return lists[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Google Task Lists:', error);
    return null;
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'all',
  selectedTaskId: null,
  notificationIds: {},
  defaultTaskListId: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskRepository.getAll(true);
      set({ tasks, isLoading: false });
    } catch (err) {
      console.error('[TaskStore] loadTasks:', err);
      set({ error: String(err), isLoading: false });
    }
  },

  syncWithGoogle: async () => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    set({ isLoading: true, error: null });
    try {
      let listId = get().defaultTaskListId;
      if (!listId) {
        listId = await getDefaultTaskListId(accessToken);
        if (listId) set({ defaultTaskListId: listId });
      }

      if (listId) {
        const googleTasks = await fetchGoogleTasks(accessToken, listId);
        
        // Merge con local: Para cada tarea de Google, si no existe localmente, crearla.
        // Si existe, actualizarla (priorizando local por ahora para simplicidad)
        const localTasks = await taskRepository.getAll(true);
        
        for (const gTask of googleTasks) {
          const exists = localTasks.find(t => t.google_task_id === gTask.id);
          if (!exists) {
            await taskRepository.create({
              title: gTask.title,
              description: gTask.description,
              status: gTask.status,
              due_date: gTask.due_date,
              parent_id: gTask.parent_id,
              priority: 'medium',
              google_task_id: gTask.id,
              google_tasklist_id: listId,
              is_synced: true
            });
          }
        }
        
        // Recargar todo
        const updatedTasks = await taskRepository.getAll(true);
        set({ tasks: updatedTasks, isLoading: false });
      }
    } catch (err) {
      console.error('[TaskStore] syncWithGoogle:', err);
      set({ error: 'Error sincronizando con Google Tasks', isLoading: false });
    }
  },

  addTask: async (dto) => {
    try {
      // 1. Crear localmente primero para UI instantánea
      const newTask = await taskRepository.create(dto);
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

      // 2. Sincronización en segundo plano con Google Tasks
      void (async () => {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) return;

        let listId = get().defaultTaskListId;
        if (!listId) {
          listId = await getDefaultTaskListId(accessToken);
          if (listId) set({ defaultTaskListId: listId });
        }

        if (listId) {
          try {
            const gTask = await createGoogleTask(accessToken, listId, newTask);
            // Actualizar la tarea local con el ID de Google
            const syncedTask = await taskRepository.update({
              id: newTask.id,
              google_task_id: gTask.id,
              google_tasklist_id: listId,
            });
            // Actualizar estado en memoria
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === syncedTask.id ? syncedTask : t)),
            }));
          } catch (e) {
            console.error('[GoogleTasks Sync] Error creating task:', e);
          }
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
      const updated = await taskRepository.update(dto);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === dto.id ? updated : t)),
      }));

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

      // Sincronización con Google Tasks en segundo plano
      void (async () => {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken || !updated.google_task_id || !updated.google_tasklist_id) return;

        try {
          await updateGoogleTask(
            accessToken,
            updated.google_tasklist_id,
            updated.google_task_id,
            updated
          );
        } catch (e) {
          console.error('[GoogleTasks Sync] Error updating task:', e);
        }
      })();
    } catch (err) {
      console.error('[TaskStore] updateTask:', err);
      set({ error: String(err) });
    }
  },

  deleteTask: async (id) => {
    try {
      const taskToDelete = get().tasks.find((t) => t.id === id);
      
      await taskRepository.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id && t.parent_id !== id),
      }));

      const notifId = get().notificationIds[id];
      if (notifId) void cancelScheduledNotification(notifId);

      // Sincronización con Google Tasks en segundo plano
      if (taskToDelete?.google_task_id && taskToDelete?.google_tasklist_id) {
        // Obtenemos una referencia estable a los IDs para TypeScript
        const googleTaskId = taskToDelete.google_task_id;
        const googleTaskListId = taskToDelete.google_tasklist_id;
        
        void (async () => {
          const accessToken = useAuthStore.getState().accessToken;
          if (!accessToken) return;

          try {
            await deleteGoogleTask(
              accessToken,
              googleTaskListId,
              googleTaskId
            );
          } catch (e) {
            console.error('[GoogleTasks Sync] Error deleting task:', e);
          }
        })();
      }
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
