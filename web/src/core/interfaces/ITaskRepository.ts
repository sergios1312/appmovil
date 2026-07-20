/**
 * @file ITaskRepository.ts
 * @layer core/interfaces
 */

import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

export interface ITaskRepository {
  getAll(includeCompleted?: boolean): Promise<Task[]>;
  getChildren(parentId: string): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(dto: CreateTaskDTO): Promise<Task>;
  update(dto: UpdateTaskDTO): Promise<Task>;
  delete(id: string): Promise<void>;
  complete(id: string): Promise<Task>;
}
