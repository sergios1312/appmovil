/**
 * @file WebTaskRepository.ts
 * @description Implementación del repositorio de tareas para Web usando localStorage.
 * Reemplaza expo-sqlite, implementa la misma interfaz ITaskRepository.
 */

import type { ITaskRepository } from '@/core/interfaces/ITaskRepository';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

const STORAGE_KEY = 'taskflow_tasks';

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class WebTaskRepository implements ITaskRepository {
  private getTasks(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  async getAll(includeCompleted = false): Promise<Task[]> {
    let tasks = this.getTasks();
    if (!includeCompleted) {
      tasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    }
    return tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getToday(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const tasks = this.getTasks();
    return tasks.filter(t => t.due_date?.startsWith(today))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getChildren(parentId: string): Promise<Task[]> {
    const tasks = this.getTasks();
    return tasks.filter(t => t.parent_id === parentId);
  }

  async getById(id: string): Promise<Task | null> {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) ?? null;
  }

  async create(dto: CreateTaskDTO): Promise<Task> {
    const tasks = this.getTasks();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...dto,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  async update(dto: UpdateTaskDTO): Promise<Task> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === dto.id);
    if (index === -1) throw new Error(`Task ${dto.id} not found`);

    const now = new Date().toISOString();
    const updated = { ...tasks[index], ...dto, updated_at: now };
    // Handle null due_date (clear it)
    if (dto.due_date === null) {
      delete (updated as Record<string, unknown>).due_date;
    }
    tasks[index] = updated as Task;
    this.saveTasks(tasks);
    return tasks[index];
  }

  async delete(id: string): Promise<void> {
    let tasks = this.getTasks();
    // Cascade delete subtasks
    const idsToDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of tasks) {
        if (t.parent_id && idsToDelete.has(t.parent_id) && !idsToDelete.has(t.id)) {
          idsToDelete.add(t.id);
          changed = true;
        }
      }
    }
    tasks = tasks.filter(t => !idsToDelete.has(t.id));
    this.saveTasks(tasks);
  }

  async complete(id: string): Promise<Task> {
    return this.update({ id, status: 'completed' });
  }
}

export const taskRepository = new WebTaskRepository();
