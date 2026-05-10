/**
 * @file Task.ts
 * @layer core/entities
 * @description Entidad de dominio pura para una Tarea.
 * No tiene dependencias de ninguna librería externa ni de otras capas.
 *
 * Decisión de diseño: Se usa parent_id (string | null) en lugar de
 * subtasks: Task[] para evitar anidamiento profundo y facilitar queries planas.
 * Las subtareas se resuelven filtrando: tasks.filter(t => t.parent_id === id)
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  /** UUID generado localmente */
  id: string;

  /** null = tarea raíz | string = ID de la tarea padre (subtarea) */
  parent_id: string | null;

  /** Título corto de la tarea */
  title: string;

  /** Descripción extendida, opcional */
  description?: string;

  /** Estado actual del ciclo de vida */
  status: TaskStatus;

  /** Nivel de prioridad */
  priority: TaskPriority;

  /** Fecha límite en formato ISO 8601 (ej: "2024-12-31T23:59:00Z") */
  due_date?: string;

  /** ID del evento en Google Calendar (cuando esté sincronizado) */
  google_event_id?: string;

  /** ID de la tarea en Google Tasks (cuando esté sincronizado) */
  google_task_id?: string;

  /** ID de la lista de Google Tasks a la que pertenece */
  google_tasklist_id?: string;

  /** Etiquetas para categorización */
  tags?: string[];

  /** Indica si la tarea está sincronizada con Google */
  is_synced: boolean;

  /** Timestamp de última sincronización con Google (ISO 8601) */
  last_synced_at?: string;

  /** Timestamp de creación (ISO 8601) */
  created_at: string;

  /** Timestamp de última modificación (ISO 8601) */
  updated_at: string;
}

/**
 * DTO para crear una nueva tarea (sin campos generados automáticamente)
 */
export type CreateTaskDTO = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>;

/**
 * DTO para actualizar una tarea (todos los campos son opcionales excepto id)
 * due_date acepta null para borrar la fecha
 */
export type UpdateTaskDTO = Partial<Omit<Task, 'id' | 'created_at'>> & {
  id: string;
  due_date?: string | null;
};

/**
 * Vista de tarea con IDs de hijos resueltos (sin anidamiento en el objeto)
 */
export interface TaskWithChildrenMeta extends Task {
  children_ids: string[];
  subtask_count: number;
  completed_subtask_count: number;
}
