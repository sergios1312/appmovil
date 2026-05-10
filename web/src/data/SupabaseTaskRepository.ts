/**
 * @file SupabaseTaskRepository.ts
 * @description Implementación del repositorio de tareas para Web usando Supabase.
 * Reemplaza WebTaskRepository (localStorage) con Supabase (PostgreSQL).
 * Implementa la misma interfaz ITaskRepository.
 */

import type { ITaskRepository } from '@/core/interfaces/ITaskRepository';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { supabase } from '@/lib/supabase';

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Mapea una fila de Supabase a la entidad Task del dominio.
 */
function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    parent_id: (row.parent_id as string) || null,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    status: (row.status as Task['status']) || 'pending',
    priority: (row.priority as Task['priority']) || 'medium',
    task_type: (row.task_type as Task['task_type']) || 'single',
    due_date: (row.due_date as string) ?? undefined,
    weight: (row.weight as number) ?? 3,
    repeat_days: (row.repeat_days as number[]) ?? undefined,
    hide_from_calendar: (row.hide_from_calendar as boolean) ?? false,
    tags: (row.tags as string[]) ?? [],
    is_synced: true,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Task;
}

export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private readonly userId: string) {}

  async getAll(includeCompleted = false): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (!includeCompleted) {
      query = query.not('status', 'in', '("completed","cancelled")');
    }

    const { data, error } = await query;
    if (error) throw new Error(`[SupabaseTaskRepo] getAll: ${error.message}`);
    return (data ?? []).map(mapRowToTask);
  }

  async getToday(): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId)
      .gte('due_date', startOfDay)
      .lt('due_date', endOfDay)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`[SupabaseTaskRepo] getToday: ${error.message}`);
    return (data ?? []).map(mapRowToTask);
  }

  async getChildren(parentId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`[SupabaseTaskRepo] getChildren: ${error.message}`);
    return (data ?? []).map(mapRowToTask);
  }

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) throw new Error(`[SupabaseTaskRepo] getById: ${error.message}`);
    return data ? mapRowToTask(data) : null;
  }

  async create(dto: CreateTaskDTO): Promise<Task> {
    const id = generateId();
    const now = new Date().toISOString();

    const row = {
      id,
      user_id: this.userId,
      parent_id: dto.parent_id || null,
      title: dto.title,
      description: dto.description || null,
      status: dto.status || 'pending',
      priority: dto.priority || 'medium',
      task_type: dto.task_type || 'single',
      due_date: dto.due_date || null,
      weight: dto.weight ?? 3,
      repeat_days: dto.repeat_days ?? null,
      hide_from_calendar: dto.hide_from_calendar ?? false,
      tags: dto.tags ?? [],
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`[SupabaseTaskRepo] create: ${error.message}`);
    return mapRowToTask(data);
  }

  async update(dto: UpdateTaskDTO): Promise<Task> {
    const updates: Record<string, unknown> = {};

    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.task_type !== undefined) updates.task_type = dto.task_type;
    if (dto.weight !== undefined) updates.weight = dto.weight;
    if (dto.repeat_days !== undefined) updates.repeat_days = dto.repeat_days;
    if (dto.hide_from_calendar !== undefined) updates.hide_from_calendar = dto.hide_from_calendar;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.parent_id !== undefined) updates.parent_id = dto.parent_id;

    if ('due_date' in dto) {
      updates.due_date = dto.due_date ?? null;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', dto.id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw new Error(`[SupabaseTaskRepo] update: ${error.message}`);
    return mapRowToTask(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) throw new Error(`[SupabaseTaskRepo] delete: ${error.message}`);
  }

  async complete(id: string): Promise<Task> {
    return this.update({ id, status: 'completed' });
  }
}
