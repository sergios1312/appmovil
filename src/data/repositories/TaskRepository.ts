/**
 * @file TaskRepository.ts
 * @layer data/repositories
 * @description Implementación real del repositorio de tareas usando SQLite.
 *
 * PATRÓN: Repository Pattern con estrategia offline-first.
 */

import { ITaskRepository } from '@/core/interfaces/ITaskRepository';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { getDatabase } from '@/infrastructure/database/database';
import * as SQLite from 'expo-sqlite';

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class TaskRepository implements ITaskRepository {
  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    return await getDatabase();
  }

  private mapRowToTask(row: any): Task {
    return {
      ...row,
      parent_id: row.parent_id || null,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      is_synced: Boolean(row.is_synced),
    };
  }

  async getAll(includeCompleted = false): Promise<Task[]> {
    const db = await this.getDB();
    let query = 'SELECT * FROM tasks';
    if (!includeCompleted) {
      query += " WHERE status NOT IN ('completed', 'cancelled')";
    }
    query += ' ORDER BY created_at DESC';

    const rows = await db.getAllAsync(query);
    return rows.map((row) => this.mapRowToTask(row));
  }

  async getToday(): Promise<Task[]> {
    const db = await this.getDB();
    const today = new Date().toISOString().split('T')[0];
    const rows = await db.getAllAsync(
      'SELECT * FROM tasks WHERE date(due_date) = ? ORDER BY created_at DESC',
      [today]
    );
    return rows.map((row) => this.mapRowToTask(row));
  }

  async getChildren(parentId: string): Promise<Task[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync(
      'SELECT * FROM tasks WHERE parent_id = ? ORDER BY created_at DESC',
      [parentId]
    );
    return rows.map((row) => this.mapRowToTask(row));
  }

  async getById(id: string): Promise<Task | null> {
    const db = await this.getDB();
    const row = await db.getFirstAsync('SELECT * FROM tasks WHERE id = ?', [id]);
    return row ? this.mapRowToTask(row) : null;
  }

  async create(dto: CreateTaskDTO): Promise<Task> {
    const db = await this.getDB();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO tasks (
        id, parent_id, title, description, status, priority,
        due_date, google_event_id, google_task_id, google_tasklist_id,
        tags, is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.parent_id || null,
        dto.title,
        dto.description || null,
        dto.status || 'pending',
        dto.priority || 'medium',
        dto.due_date || null,
        dto.google_event_id || null,
        dto.google_task_id || null,
        dto.google_tasklist_id || null,
        JSON.stringify(dto.tags || []),
        0,
        now,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create task');
    return created;
  }

  async update(dto: UpdateTaskDTO): Promise<Task> {
    const db = await this.getDB();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: any[] = [];

    // Mapeo de campos a actualizar
    const mappings: Record<string, string> = {
      parent_id: 'parent_id',
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      due_date: 'due_date',
      google_event_id: 'google_event_id',
      google_task_id: 'google_task_id',
      google_tasklist_id: 'google_tasklist_id',
    };

    for (const [key, dbField] of Object.entries(mappings)) {
      if (dto.hasOwnProperty(key)) {
        fields.push(`${dbField} = ?`);
        values.push((dto as any)[key]);
      }
    }

    if (dto.tags) {
      fields.push('tags = ?');
      values.push(JSON.stringify(dto.tags));
    }

    fields.push('updated_at = ?');
    values.push(now);

    fields.push('is_synced = ?');
    values.push(0);

    values.push(dto.id);

    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);

    const updated = await this.getById(dto.id);
    if (!updated) throw new Error(`Task ${dto.id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    // ON DELETE CASCADE se encarga de las subtareas según el schema en database.ts
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  }

  async complete(id: string): Promise<Task> {
    return this.update({
      id,
      status: 'completed',
    });
  }
}

export const taskRepository = new TaskRepository();
