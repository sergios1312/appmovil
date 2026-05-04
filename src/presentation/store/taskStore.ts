import { create } from 'zustand';
import {
  cancelScheduledNotification,
  scheduleTaskDueNotification,
} from '@/infrastructure/services/notifications';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { taskRepository } from '@/data/repositories/TaskRepository';

type NotificationMap = Record<string, string>;

interface TaskStore {
  tasks: Task[];
  notificationIds: NotificationMap;
  isLoading: boolean;
  
  // Acciones
  loadTasks: () => Promise<void>;
  addTask: (taskData: CreateTaskDTO) => Promise<Task>;
  updateTask: (dto: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getSubtasks: (parentId: string) => Task[];
}

const syncTaskNotification = async (
  task: Task,
  currentNotificationId: string | undefined
): Promise<string | null> => {
  if (currentNotificationId) {
    await cancelScheduledNotification(currentNotificationId);
  }

  if (!task.due_date) {
    return null;
  }

  // Mapeo simple para la notificación (puedes ajustar los campos)
  return scheduleTaskDueNotification(task);
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  notificationIds: {},
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskRepository.getAll(true);
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (taskInput) => {
    const newTask = await taskRepository.create(taskInput);
    
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));

    // Notificaciones en background
    void (async () => {
      const nextNotificationId = await syncTaskNotification(newTask, undefined);
      if (nextNotificationId) {
        set((state) => ({
          notificationIds: {
            ...state.notificationIds,
            [newTask.id]: nextNotificationId,
          },
        }));
      }
    })();

    return newTask;
  },

  updateTask: async (dto) => {
    const updatedTask = await taskRepository.update(dto);
    
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === dto.id ? updatedTask : t)),
    }));

    const currentNotificationId = get().notificationIds[dto.id];

    void (async () => {
      const nextNotificationId = await syncTaskNotification(updatedTask, currentNotificationId);
      set((state) => {
        const nextMap = { ...state.notificationIds };
        if (nextNotificationId) {
          nextMap[dto.id] = nextNotificationId;
        } else {
          delete nextMap[dto.id];
        }
        return { notificationIds: nextMap };
      });
    })();
  },

  deleteTask: async (id) => {
    const taskToDelete = get().tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    await taskRepository.delete(id);

    // Nota: El repositorio ya debería manejar el borrado en cascada en SQLite
    // pero actualizamos el estado local filtrando.
    set((state) => {
      // Simplificado: recargamos todo para asegurar consistencia con el borrado en cascada
      return {
        tasks: state.tasks.filter(t => t.id !== id && t.parent_id !== id)
      };
    });

    const notificationId = get().notificationIds[id];
    if (notificationId) {
      void cancelScheduledNotification(notificationId);
    }
  },

  getSubtasks: (parentId) => {
    return get().tasks.filter((task) => task.parent_id === parentId);
  },
}));
