import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../../core/entities/Task';

interface TaskState {
  tasks: Task[];
  addTask: (taskData: CreateTaskDTO) => void;
  updateTask: (taskData: UpdateTaskDTO) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (taskData) => {
        // Generamos un ID básico (MVP offline)
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const now = new Date().toISOString();

        const newTask: Task = {
          ...taskData,
          id,
          created_at: now,
          updated_at: now,
          is_synced: false,
        } as Task;

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      updateTask: (taskData) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskData.id
              ? { ...task, ...taskData, updated_at: new Date().toISOString() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const newStatus = task.status === 'completed' ? 'pending' : 'completed';
              return { ...task, status: newStatus, updated_at: new Date().toISOString() };
            }
            return task;
          }),
        }));
      },
    }),
    {
      name: 'task-storage', // name of item in storage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
