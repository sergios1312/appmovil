/**
 * @file taskStore.ts — Web task store with Google Tasks sync
 */

import { create } from 'zustand';
import type { Task, CreateTaskDTO, UpdateTaskDTO, TaskType } from '@/core/entities/Task';
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
export type TaskTypeFilter = 'all' | 'routine' | 'single' | 'project' | 'habit_group';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskFilter;
  activeTypeFilter: TaskTypeFilter;
  defaultTaskListId: string | null;

  loadTasks: () => Promise<void>;
  addTask: (dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  getSubtasks: (parentId: string) => Task[];
  setFilter: (filter: TaskFilter) => void;
  setTypeFilter: (filter: TaskTypeFilter) => void;
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

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeFilter: 'all',
  activeTypeFilter: 'all',
  defaultTaskListId: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskRepository.getAll(true);
      set({ tasks: autoCompleteHabitGroups(tasks), isLoading: false });
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
              task_type: 'single',
              weight: 3,
              hide_from_calendar: false,
              google_task_id: gTask.id,
              google_tasklist_id: listId!,
              is_synced: true,
            });
          }
        }
        const updatedTasks = await taskRepository.getAll(true);
        set({ tasks: autoCompleteHabitGroups(updatedTasks), isLoading: false });
      }
    } catch {
      set({ error: 'Error sincronizando con Google Tasks', isLoading: false });
    }
  },

  addTask: async (dto) => {
    try {
      const newTask = await taskRepository.create(dto);
      set((state) => ({ tasks: autoCompleteHabitGroups([newTask, ...state.tasks]) }));

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
        tasks: autoCompleteHabitGroups(
          state.tasks.map((t) => (t.id === dto.id ? updated : t))
        ),
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
  setTypeFilter: (filter) => set({ activeTypeFilter: filter }),
  clearError: () => set({ error: null }),
}));

export const selectFilteredTasks = (state: TaskStore): Task[] => {
  let rootTasks = state.tasks.filter((t) => !t.parent_id);
  const today = new Date().toISOString().split('T')[0];

  // Apply type filter
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

  // Progressive milestones
  const milestones = [10, 25, 50, 75, 100, 150];
  const currentMilestone = milestones.find(m => totalWeight < m) ?? milestones[milestones.length - 1];
  const progress = Math.min(Math.round((totalWeight / currentMilestone) * 100), 100);
  const remaining = Math.max(currentMilestone - totalWeight, 0);

  return {
    totalWeight,
    totalCompleted,
    currentMilestone,
    progress,
    remaining,
  };
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

    return {
      ...project,
      totalSubtasks: total,
      completedSubtasks: completed,
      progress,
    };
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
