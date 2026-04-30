/**
 * @file UpdateTaskUseCase.ts
 * @layer core/use-cases
 */

import { z } from 'zod';
import { ITaskRepository } from '@/src/core/interfaces/ITaskRepository';
import { Task, UpdateTaskDTO } from '@/src/core/entities/Task';

export const UpdateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const validated = UpdateTaskSchema.parse(input);

    const existing = await this.taskRepository.getById(validated.id);
    if (!existing) {
      throw new Error(`Tarea con ID ${validated.id} no encontrada`);
    }

    // Regla de negocio: no se puede modificar una tarea cancelada
    if (existing.status === 'cancelled' && validated.status !== 'pending') {
      throw new Error('Una tarea cancelada solo puede reabrirse como pendiente');
    }

    const dto: UpdateTaskDTO = {
      ...validated,
      // Zod puede retornar null para campos nullable, TaskDTO usa undefined
      due_date: validated.due_date ?? undefined,
      is_synced: false, // Marcar como pendiente de sincronización
    };

    return this.taskRepository.update(dto);
  }

  async toggleComplete(id: string): Promise<Task> {
    const task = await this.taskRepository.getById(id);
    if (!task) throw new Error(`Tarea ${id} no encontrada`);

    if (task.status === 'completed') {
      return this.taskRepository.update({ id, status: 'pending', is_synced: false });
    }
    return this.taskRepository.complete(id);
  }
}
