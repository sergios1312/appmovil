/**
 * @file TaskRepository.ts
 * @layer data/repositories
 * @description Implementación concreta de ITaskRepository.
 * En modo mock: usa los datos estáticos de tasks.mock.ts.
 * En modo real (futuro): coordinará local (SQLite) + remote (Google APIs).
 *
 * PATRÓN: Repository Pattern con estrategia offline-first:
 * 1. Lee siempre desde local (SQLite)
 * 2. Escribe siempre en local primero
 * 3. Sincroniza con Google en segundo plano (cuando haya conexión)
 */

import { ITaskRepository } from '@/src/core/interfaces/ITaskRepository';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/src/core/entities/Task';
import {
  MOCK_TASKS,
  getMockTodayTasks,
  getMockChildren,
} from '@/src/data/mock/tasks.mock';

// Almacén en memoria para el modo mock (simula SQLite)
let taskStore: Map<string, Task> = new Map(
  MOCK_TASKS.map(task => [task.id, task])
);

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class TaskRepository implements ITaskRepository {

  async getAll(includeCompleted = false): Promise<Task[]> {
    const tasks = Array.from(taskStore.values());
    if (includeCompleted) return tasks;
    return tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  }

  async getToday(): Promise<Task[]> {
    // TODO (Real): Consultar SQLite con WHERE date(due_date) = date('now')
    const today = new Date().toDateString();
    return Array.from(taskStore.values()).filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date).toDateString() === today;
    });
  }

  async getChildren(parentId: string): Promise<Task[]> {
    // TODO (Real): SELECT * FROM tasks WHERE parent_id = ?
    return Array.from(taskStore.values()).filter(t => t.parent_id === parentId);
  }

  async getById(id: string): Promise<Task | null> {
    return taskStore.get(id) ?? null;
  }

  async create(dto: CreateTaskDTO): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...dto,
      id: generateId(),
      is_synced: false,
      created_at: now,
      updated_at: now,
    };

    // TODO (Real): INSERT INTO tasks VALUES (...)
    taskStore.set(newTask.id, newTask);
    return newTask;
  }

  async update(dto: UpdateTaskDTO): Promise<Task> {
    const existing = taskStore.get(dto.id);
    if (!existing) throw new Error(`Task ${dto.id} not found`);

    const updated: Task = {
      ...existing,
      ...dto,
      updated_at: new Date().toISOString(),
    };

    // TODO (Real): UPDATE tasks SET ... WHERE id = ?
    taskStore.set(dto.id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // TODO (Real): DELETE FROM tasks WHERE id = ? (con ON DELETE CASCADE para subtareas)
    taskStore.delete(id);
  }

  async complete(id: string): Promise<Task> {
    return this.update({
      id,
      status: 'completed',
      is_synced: false,
    });
  }

  /**
   * Sincronización con Google (implementar en próxima iteración)
   * Estrategia: Last-Write-Wins con timestamp
   */
  async syncWithGoogle(): Promise<void> {
    console.log('[TaskRepository] syncWithGoogle: pendiente de implementación');
    // TODO: Obtener token → llamar GoogleTasksService.getTasks() → merge local/remote
  }

  /**
   * Resetea el store al estado inicial (útil para testing)
   */
  reset(): void {
    taskStore = new Map(MOCK_TASKS.map(task => [task.id, task]));
  }
}

// Singleton para uso en toda la app (DI manual)
export const taskRepository = new TaskRepository();
