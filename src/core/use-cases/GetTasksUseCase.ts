/**
 * @file GetTasksUseCase.ts
 * @layer core/use-cases
 * @description Casos de uso para consultas de tareas.
 * Solo orquesta la lógica de negocio usando la interfaz ITaskRepository.
 * No conoce implementaciones concretas.
 */

import { ITaskRepository } from '@/src/core/interfaces/ITaskRepository';
import { Task, TaskWithChildrenMeta } from '@/src/core/entities/Task';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Obtiene todas las tareas raíz (sin parent_id) con metadata de subtareas
   */
  async getAllRootTasks(includeCompleted = false): Promise<TaskWithChildrenMeta[]> {
    const allTasks = await this.taskRepository.getAll(includeCompleted);
    const rootTasks = allTasks.filter(t => t.parent_id === null);

    return rootTasks.map(task => this.enrichWithChildrenMeta(task, allTasks));
  }

  /**
   * Obtiene las tareas de hoy con metadata de subtareas
   */
  async getTodayTasks(): Promise<TaskWithChildrenMeta[]> {
    const todayTasks = await this.taskRepository.getToday();
    const allTasks = await this.taskRepository.getAll(true);

    return todayTasks.map(task => this.enrichWithChildrenMeta(task, allTasks));
  }

  /**
   * Obtiene una tarea por ID con sus subtareas directas
   */
  async getTaskWithChildren(id: string): Promise<{ task: Task; children: Task[] } | null> {
    const task = await this.taskRepository.getById(id);
    if (!task) return null;

    const children = await this.taskRepository.getChildren(id);
    return { task, children };
  }

  /**
   * Enriquece una tarea con metadata de sus subtareas (flat lookup)
   */
  private enrichWithChildrenMeta(task: Task, allTasks: Task[]): TaskWithChildrenMeta {
    const directChildren = allTasks.filter(t => t.parent_id === task.id);
    const completedChildren = directChildren.filter(t => t.status === 'completed');

    return {
      ...task,
      children_ids: directChildren.map(t => t.id),
      subtask_count: directChildren.length,
      completed_subtask_count: completedChildren.length,
    };
  }
}
