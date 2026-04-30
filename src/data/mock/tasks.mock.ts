/**
 * @file tasks.mock.ts
 * @layer data/mock
 * @description Datos mockeados para desarrollo y testing.
 * Simulan la estructura que devolverían Google Tasks y Calendar.
 */

import { Task } from '@/src/core/entities/Task';

const now = new Date().toISOString();
const today = new Date();
const todayStr = today.toISOString();

const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

export const MOCK_TASKS: Task[] = [
  // ── Tarea raíz 1: Proyecto App Móvil ──────────────────────────────────────
  {
    id: 'task-001',
    parent_id: null,
    title: 'Desarrollar App Móvil de Productividad',
    description: 'Proyecto principal de la aplicación móvil con React Native y Expo',
    status: 'in_progress',
    priority: 'high',
    due_date: tomorrow.toISOString(),
    tags: ['desarrollo', 'react-native', 'expo'],
    is_synced: false,
    created_at: now,
    updated_at: now,
  },

  // ── Subtarea nivel 1 de task-001 ──────────────────────────────────────────
  {
    id: 'task-002',
    parent_id: 'task-001',
    title: 'Configurar arquitectura base',
    description: 'Implementar Clean Architecture con separación de capas',
    status: 'completed',
    priority: 'high',
    due_date: todayStr,
    tags: ['arquitectura'],
    is_synced: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'task-003',
    parent_id: 'task-001',
    title: 'Diseñar sistema de navegación',
    description: 'Tab Navigation + Stack anidado con Expo Router',
    status: 'pending',
    priority: 'medium',
    due_date: tomorrow.toISOString(),
    tags: ['navegación', 'expo-router'],
    is_synced: false,
    created_at: now,
    updated_at: now,
  },

  // ── Subtarea nivel 2 de task-002 ──────────────────────────────────────────
  {
    id: 'task-004',
    parent_id: 'task-002',
    title: 'Crear entidades de dominio (Task, User)',
    status: 'completed',
    priority: 'high',
    is_synced: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'task-005',
    parent_id: 'task-002',
    title: 'Definir interfaces de repositorio',
    status: 'completed',
    priority: 'high',
    is_synced: false,
    created_at: now,
    updated_at: now,
  },

  // ── Tarea raíz 2: Reuniones ───────────────────────────────────────────────
  {
    id: 'task-006',
    parent_id: null,
    title: 'Reunión de planificación Q2',
    description: 'Definir objetivos del próximo trimestre con el equipo',
    status: 'pending',
    priority: 'urgent',
    due_date: todayStr,
    google_event_id: 'gcal_event_mock_001', // Simula evento de Google Calendar
    tags: ['reunión', 'planificación'],
    is_synced: true,
    last_synced_at: now,
    created_at: now,
    updated_at: now,
  },

  // ── Tarea raíz 3: Personal ────────────────────────────────────────────────
  {
    id: 'task-007',
    parent_id: null,
    title: 'Leer libro "Clean Architecture"',
    description: 'Capítulos 15-20 sobre componentes y arquitectura de sistemas',
    status: 'pending',
    priority: 'low',
    tags: ['personal', 'lectura'],
    is_synced: false,
    created_at: now,
    updated_at: now,
  },

  // ── Tarea raíz 4: Vencida ─────────────────────────────────────────────────
  {
    id: 'task-008',
    parent_id: null,
    title: 'Revisar propuesta de cliente',
    description: 'Propuesta técnica para nuevo proyecto',
    status: 'pending',
    priority: 'high',
    due_date: yesterday.toISOString(), // Vencida
    tags: ['cliente', 'propuesta'],
    is_synced: false,
    created_at: now,
    updated_at: now,
  },
];

/**
 * Helper: retorna las tareas de hoy
 */
export function getMockTodayTasks(): Task[] {
  const todayDate = new Date().toDateString();
  return MOCK_TASKS.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date).toDateString() === todayDate;
  });
}

/**
 * Helper: retorna las tareas raíz
 */
export function getMockRootTasks(): Task[] {
  return MOCK_TASKS.filter(t => t.parent_id === null);
}

/**
 * Helper: retorna subtareas de un padre
 */
export function getMockChildren(parentId: string): Task[] {
  return MOCK_TASKS.filter(t => t.parent_id === parentId);
}
