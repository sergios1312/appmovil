/**
 * @file taskFilters.ts
 * @layer utils
 * @description Lógica de filtrado de tareas por vista temporal (diaria, semanal, mensual)
 * y resolución de recurrencia para tareas repetitivas.
 *
 * Reglas de negocio:
 * - Tareas repetitivas (routine / habit_group): se regeneran cada día correspondiente
 *   según repeat_days. Aunque estén completadas ayer, aparecen hoy como PENDIENTES.
 *   → El estado de completado se resuelve por fecha: si la tarea fue completada el mismo
 *     día de la instancia, se muestra completada. Si no (fue otro día), se muestra pendiente.
 * - Tareas únicas (single / project): solo aparecen en su fecha programada (due_date).
 *
 * Reglas de vista:
 * - Diaria: todas las tareas + subtareas del día
 * - Semanal: todas las tareas de la semana (sin subtareas)
 * - Mensual: solo tareas únicas/proyectos (ocultar rutinas), sin subtareas
 */

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isWithinInterval,
  isSameDay,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, TaskType } from '@/core/entities/Task';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ViewMode = 'daily' | 'weekly' | 'monthly';

/** Tarea materializada: una instancia concreta de una tarea para una fecha específica */
export interface MaterializedTask extends Task {
  /** Fecha efectiva para la que se materializó esta instancia (ISO date string YYYY-MM-DD) */
  effective_date: string;
  /** true si esta instancia fue generada por recurrencia (no es la instancia original) */
  is_recurrence_instance: boolean;
}

/** Tareas agrupadas por fecha para vistas de calendario */
export interface TasksByDate {
  [dateKey: string]: MaterializedTask[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tipos de tarea que se consideran repetitivos/rutinarios */
const RECURRING_TASK_TYPES: TaskType[] = ['routine', 'habit_group'];

/** Verifica si una tarea es de tipo repetitivo */
export function isRecurringTask(task: Task): boolean {
  return RECURRING_TASK_TYPES.includes(task.task_type) && 
         Array.isArray(task.repeat_days) && 
         task.repeat_days.length > 0;
}

/** Verifica si una tarea es de tipo único (single o project) */
export function isSingleTask(task: Task): boolean {
  return !isRecurringTask(task);
}

/** Verifica si una tarea es raíz (no es subtarea) */
export function isRootTask(task: Task): boolean {
  return !task.parent_id;
}

/** Obtiene la clave de fecha YYYY-MM-DD de una fecha */
export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Verifica si una tarea repetitiva se ejecuta en un día de la semana dado.
 * @param task - tarea con repeat_days
 * @param dayOfWeek - 0=domingo, 1=lunes, ... 6=sábado
 */
export function taskRunsOnDay(task: Task, dayOfWeek: number): boolean {
  if (!task.repeat_days || task.repeat_days.length === 0) return false;
  return task.repeat_days.includes(dayOfWeek);
}

/**
 * Verifica si una tarea única cae en una fecha dada.
 */
export function taskFallsOnDate(task: Task, date: Date): boolean {
  if (!task.due_date) return false;
  return isSameDay(new Date(task.due_date), date);
}

// ─── Estado efectivo por instancia de día ─────────────────────────────────────────────────────

/**
 * Calcula el estado efectivo de una tarea repetitiva para una fecha específica.
 *
 * REGLA CLAVE: Una tarea rutinaria se considera "completada" en un día
 * únicamente si su campo `due_date` apunta exactamente a ese día
 * (que es la forma en que el store marca la complección de la instancia).
 * Si fue completada otro día (o `due_date` es nulo), se muestra como `pending`.
 *
 * @param task     - La tarea raw de la BD
 * @param forDate  - La fecha de la instancia que se está materializando
 */
export function getEffectiveRecurrenceStatus(task: Task, forDate: Date): Task['status'] {
  // Si no está completada, el estado es el mismo que tiene en BD
  if (task.status !== 'completed') return task.status;

  // Si está completada: solo mantener el estado si due_date corresponde al mismo día
  // (el store actualiza due_date cuando se completa una instancia de rutina)
  if (task.due_date && isSameDay(new Date(task.due_date), forDate)) {
    return 'completed';
  }

  // Fue completada otro día → para esta instancia la tarea vuelve a estar pendiente
  return 'pending';
}

/**
 * Materializa una tarea para una fecha específica, creando una instancia concreta.
 *
 * Para tareas REPETITIVAS:
 * - Resetea el status a 'pending' si la compleción fue en otro día distinto a `date`.
 * - Esto garantiza que al cambiar de día las rutinas vuelven a aparecer como pendientes.
 *
 * Para tareas ÚNICAS: mantiene el estado original de la BD.
 */
function materializeTask(task: Task, date: Date, isRecurrence: boolean): MaterializedTask {
  const effectiveStatus = isRecurrence
    ? getEffectiveRecurrenceStatus(task, date)
    : task.status;

  return {
    ...task,
    status: effectiveStatus,
    effective_date: getDateKey(date),
    is_recurrence_instance: isRecurrence,
  };
}


/**
 * Obtiene todas las tareas que corresponden a una fecha específica.
 * Combina tareas repetitivas que corren ese día + tareas únicas programadas para ese día.
 */
export function getTasksForDate(allTasks: Task[], date: Date): MaterializedTask[] {
  const dayOfWeek = getDay(date); // 0=domingo
  const dateKey = getDateKey(date);
  const result: MaterializedTask[] = [];

  for (const task of allTasks) {
    // Solo procesar tareas raíz en este nivel
    // Las subtareas se resuelven en la vista diaria

    if (isRecurringTask(task)) {
      // Tarea repetitiva: aparece si el día de la semana coincide con repeat_days
      if (taskRunsOnDay(task, dayOfWeek)) {
        result.push(materializeTask(task, date, true));
      }
    } else {
      // Tarea única/proyecto: solo aparece en su due_date
      if (taskFallsOnDate(task, date)) {
        result.push(materializeTask(task, date, false));
      }
    }
  }

  return result;
}

/**
 * Obtiene las tareas de una semana completa, agrupadas por fecha.
 */
export function getTasksForWeek(allTasks: Task[], referenceDate: Date): TasksByDate {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const result: TasksByDate = {};

  // Solo tareas raíz para la vista semanal
  const rootTasks = allTasks.filter(isRootTask);

  for (const day of days) {
    const dateKey = getDateKey(day);
    result[dateKey] = getTasksForDate(rootTasks, day);
  }

  return result;
}

/**
 * Obtiene las tareas de un mes completo, agrupadas por fecha.
 * REGLA DE EXCEPCIÓN: omite tareas repetitivas/rutinarias.
 */
export function getTasksForMonth(allTasks: Task[], referenceDate: Date): TasksByDate {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const result: TasksByDate = {};

  // Solo tareas raíz NO repetitivas para la vista mensual
  const singleRootTasks = allTasks.filter(t => isRootTask(t) && isSingleTask(t));

  for (const day of days) {
    const dateKey = getDateKey(day);
    const tasksForDay: MaterializedTask[] = [];

    for (const task of singleRootTasks) {
      if (taskFallsOnDate(task, day)) {
        tasksForDay.push(materializeTask(task, day, false));
      }
    }

    // Solo incluir fechas que tienen tareas
    if (tasksForDay.length > 0) {
      result[dateKey] = tasksForDay;
    }
  }

  return result;
}

// ─── Selectores de vista ──────────────────────────────────────────────────────

/**
 * VISTA DIARIA: todas las tareas del día (repetitivas + únicas) con subtareas.
 * Incluye tanto tareas raíz como subtareas para la fecha dada.
 */
export function getDailyView(allTasks: Task[], date: Date = new Date()): MaterializedTask[] {
  const dayOfWeek = getDay(date);
  const result: MaterializedTask[] = [];

  for (const task of allTasks) {
    if (isRecurringTask(task)) {
      // Repetitiva: aparece si el día de la semana coincide
      if (taskRunsOnDay(task, dayOfWeek)) {
        result.push(materializeTask(task, date, true));
      }
    } else {
      // Única: aparece solo en su due_date
      if (taskFallsOnDate(task, date)) {
        result.push(materializeTask(task, date, false));
      }

      // Subtareas de tareas únicas: se incluyen si la tarea padre cae en ese día
      // o si la subtarea misma tiene due_date ese día
      if (task.parent_id) {
        const parent = allTasks.find(t => t.id === task.parent_id);
        if (parent) {
          if (isRecurringTask(parent) && taskRunsOnDay(parent, dayOfWeek)) {
            // Subtarea de tarea repetitiva: incluir
            if (!result.some(r => r.id === task.id)) {
              result.push(materializeTask(task, date, true));
            }
          }
          // Si la subtarea tiene su propio due_date en este día, ya fue incluida arriba
        }
      }
    }
  }

  return result;
}

/**
 * VISTA SEMANAL: tareas de la semana, solo raíz (sin subtareas).
 * Incluye tanto repetitivas como únicas.
 * Retorna un array plano de las tareas materializadas de toda la semana.
 */
export function getWeeklyView(allTasks: Task[], referenceDate: Date = new Date()): MaterializedTask[] {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const rootTasks = allTasks.filter(isRootTask);
  const result: MaterializedTask[] = [];
  // Para evitar duplicados de la misma tarea en la vista plana
  const addedTaskDates = new Set<string>();

  for (const day of days) {
    for (const task of rootTasks) {
      const key = `${task.id}-${getDateKey(day)}`;

      if (isRecurringTask(task)) {
        if (taskRunsOnDay(task, getDay(day)) && !addedTaskDates.has(key)) {
          result.push(materializeTask(task, day, true));
          addedTaskDates.add(key);
        }
      } else {
        if (taskFallsOnDate(task, day) && !addedTaskDates.has(key)) {
          result.push(materializeTask(task, day, false));
          addedTaskDates.add(key);
        }
      }
    }
  }

  return result;
}

/**
 * VISTA MENSUAL: solo tareas únicas/proyectos (sin rutinas), sin subtareas.
 * Retorna un array plano.
 */
export function getMonthlyView(allTasks: Task[], referenceDate: Date = new Date()): MaterializedTask[] {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Solo tareas raíz NO repetitivas
  const singleRootTasks = allTasks.filter(t => isRootTask(t) && isSingleTask(t));
  const result: MaterializedTask[] = [];

  for (const day of days) {
    for (const task of singleRootTasks) {
      if (taskFallsOnDate(task, day)) {
        result.push(materializeTask(task, day, false));
      }
    }
  }

  return result;
}

/**
 * Selector principal: obtiene tareas para la vista activa.
 */
export function getTasksForView(
  allTasks: Task[],
  viewMode: ViewMode,
  referenceDate: Date = new Date()
): MaterializedTask[] {
  switch (viewMode) {
    case 'daily':
      return getDailyView(allTasks, referenceDate);
    case 'weekly':
      return getWeeklyView(allTasks, referenceDate);
    case 'monthly':
      return getMonthlyView(allTasks, referenceDate);
    default:
      return getDailyView(allTasks, referenceDate);
  }
}

/**
 * Obtiene las estadísticas de hoy considerando recurrencia.
 * Las tareas repetitivas se cuentan como pendientes/completadas según su estado actual.
 */
export function getTodayStatsWithRecurrence(allTasks: Task[]): {
  total: number;
  pending: number;
  completed: number;
  routines: number;
  singles: number;
} {
  const todayTasks = getDailyView(allTasks, new Date());
  const rootTodayTasks = todayTasks.filter(t => isRootTask(t));

  const completed = rootTodayTasks.filter(t => t.status === 'completed').length;
  const routines = rootTodayTasks.filter(t => t.is_recurrence_instance).length;
  const singles = rootTodayTasks.filter(t => !t.is_recurrence_instance).length;

  return {
    total: rootTodayTasks.length,
    pending: rootTodayTasks.length - completed,
    completed,
    routines,
    singles,
  };
}
