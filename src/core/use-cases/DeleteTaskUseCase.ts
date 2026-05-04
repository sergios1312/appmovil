/**
 * @file DeleteTaskUseCase.ts
 * @layer core/use-cases
 */

import { ITaskRepository } from '@/core/interfaces/ITaskRepository';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Elimina una tarea. Si tiene subtareas, las elimina en cascada.
   * @param id - ID de la tarea a eliminar
   * @param cascade - Si es true, elimina también las subtareas (default: true)
   */
  async execute(id: string, cascade = true): Promise<void> {
    const task = await this.taskRepository.getById(id);
    if (!task) throw new Error(`Tarea ${id} no encontrada`);

    if (cascade) {
      // Eliminar subtareas primero (el repositorio puede manejar esto en DB)
      const children = await this.taskRepository.getChildren(id);
      for (const child of children) {
        await this.execute(child.id, true); // recursivo para N niveles
      }
    }

    await this.taskRepository.delete(id);
  }
}
