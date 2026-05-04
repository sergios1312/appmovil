/**
 * @file ITaskRepository.ts
 * @layer core/interfaces
 * @description Contrato abstracto para el repositorio de tareas.
 * Las capas de data/ implementan esta interfaz; core/ solo la conoce.
 * Principio de Inversión de Dependencias (DIP).
 */

import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

export interface ITaskRepository {
  /**
   * Obtiene todas las tareas (plano, sin anidamiento)
   * @param includeCompleted - Si se deben incluir tareas completadas
   */
  getAll(includeCompleted?: boolean): Promise<Task[]>;

  /**
   * Obtiene las tareas de hoy (por due_date)
   */
  getToday(): Promise<Task[]>;

  /**
   * Obtiene subtareas de una tarea padre
   * @param parentId - ID de la tarea padre
   */
  getChildren(parentId: string): Promise<Task[]>;

  /**
   * Obtiene una tarea por su ID
   */
  getById(id: string): Promise<Task | null>;

  /**
   * Crea una nueva tarea y la persiste localmente
   */
  create(dto: CreateTaskDTO): Promise<Task>;

  /**
   * Actualiza una tarea existente por ID
   */
  update(dto: UpdateTaskDTO): Promise<Task>;

  /**
   * Elimina una tarea y sus subtareas en cascada
   */
  delete(id: string): Promise<void>;

  /**
   * Marca una tarea como completada
   */
  complete(id: string): Promise<Task>;

  /**
   * Sincroniza las tareas locales con Google Tasks/Calendar
   * Se implementará en fases posteriores
   */
  syncWithGoogle?(): Promise<void>;
}
