/**
 * @file taskStore.ts — Web task store with Google Tasks sync
 */

import { create } from 'zustand';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { taskRepository } from '@/data/WebTaskRepository';
import { useAuthStore } from '@/store/authStore';
import {
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  fetchGoogleTaskLists,
  fetchGoogleTasks,
} from '@/services/googleTasks';

export type TaskFilter = 'all' | 'today' | 'pending' | 'completed';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  defaultTaskListId: string | null;

  loadTasks: () => Promise<void>;
  addTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  getSubtasks: (parentId: string) => Task[];
  setFilter: (filter: TaskFilter) => void;
  clearError: () => void;
  syncWithGoogle: () => Promise<void>;
}

async function getDefaultTaskListId(accessToken: string): Promise<string | null> {
  try {
    const lists = await fetchGoogleTaskLists(accessToken);
    return lists.length > 0 ? lists[0].id : null;
  } catch {
    return null;
  }
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'all',
  defaultTaskListId: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskRepository.getAll(true);
      set({ tasks, isLoading: false });
    } catch (err) {
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
              google_tasklist_id: listId!,
              is_synced: true,
            });
          }
        }
        const updatedTasks = await taskRepository.getAll(true);
        set({ tasks: updatedTasks, isLoading: false });
      }
    } catch {
      set({ error: 'Error sincronizando con Google Tasks', isLoading: false });
    }
  },

  addTask: async (dto) => {
    try {
      const newTask = await taskRepository.create(dto);
      set((state) => ({ tasks: [newTask, ...state.tasks] }));

      // Background Google Tasks sync
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        (async () => {
          let listId = get().defaultTaskListId;
          if (!listId) {
            listId = await getDefaultTaskListId(accessToken);
            if (listId) set({ defaultTaskListId: listId });
          }
          if (listId) {
            try {
              const gTask = await createGoogleTask(accessToken, listId, newTask);
              const syncedTask = await taskRepository.update({
                id: newTask.id,
                google_task_id: gTask.id,
                google_tasklist_id: listId,
              });
              set((state) => ({
                tasks: state.tasks.map((t) => (t.id === syncedTask.id ? syncedTask : t)),
              }));
            } catch (e) {
              console.error('[GoogleTasks Sync] Error creating task:', e);
            }
          }
        })();
      }

      return newTask;
    } catch (err) {
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

      // Background Google Tasks sync
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken && updated.google_task_id && updated.google_tasklist_id) {
        updateGoogleTask(accessToken, updated.google_tasklist_id, updated.google_task_id, updated)
          .catch(e => console.error('[GoogleTasks Sync] Error updating:', e));
      }
    } catch (err) {
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

      if (taskToDelete?.google_task_id && taskToDelete?.google_tasklist_id) {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
          deleteGoogleTask(accessToken, taskToDelete.google_tasklist_id, taskToDelete.google_task_id)
            .catch(e => console.error('[GoogleTasks Sync] Error deleting:', e));
        }
      }
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
  clearError: () => set({ error: null }),
}));

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

export const selectTodayStats = (state: TaskStore) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter((t) => t.due_date?.startsWith(today));
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.status === 'completed').length;
  const urgent = todayTasks.filter((t) => t.priority === 'urgent').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, urgent, progress };
};
