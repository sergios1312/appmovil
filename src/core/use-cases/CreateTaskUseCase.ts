/**
 * @file CreateTaskUseCase.ts
 * @layer core/use-cases
 * @description Caso de uso para crear nuevas tareas con validación de negocio.
 */

import { z } from 'zod';
import { ITaskRepository } from '@/src/core/interfaces/ITaskRepository';
import { Task, CreateTaskDTO } from '@/src/core/entities/Task';

// Schema de validación de negocio (independiente de la UI)
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío').max(200, 'Título demasiado largo'),
  description: z.string().max(2000).optional(),
  parent_id: z.string().uuid().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime({ offset: true }).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    // Validación de negocio con Zod
    const validated = CreateTaskSchema.parse(input);

    // Regla de negocio: no se permite más de 3 niveles de anidamiento
    if (validated.parent_id) {
      await this.validateNestingDepth(validated.parent_id);
    }

    const dto: CreateTaskDTO = {
      ...validated,
      status: 'pending',
      is_synced: false,
    };

    return this.taskRepository.create(dto);
  }

  /**
   * Valida que la profundidad de anidamiento no supere 3 niveles
   */
  private async validateNestingDepth(parentId: string, depth = 1): Promise<void> {
    if (depth > 3) {
      throw new Error('No se permiten más de 3 niveles de subtareas');
    }

    const parent = await this.taskRepository.getById(parentId);
    if (parent?.parent_id) {
      await this.validateNestingDepth(parent.parent_id, depth + 1);
    }
  }
}
