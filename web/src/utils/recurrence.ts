import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';
import { localDayKey, dayKeyOf } from '@/utils/dateHelpers';

const RECURRENCE_KEY = 'taskflow_recurrence_date';

/**
 * Verifica si la recurrencia diaria ya fue procesada hoy.
 * Usa localStorage para evitar duplicados por múltiples cargas/renders.
 */
function alreadyProcessedToday(): boolean {
  return localStorage.getItem(RECURRENCE_KEY) === localDayKey();
}

function markProcessedToday(): void {
  localStorage.setItem(RECURRENCE_KEY, localDayKey());
}

/**
 * Clave de SERIE estable para una rutina raíz.
 *
 * Antes se agrupaba solo por título, lo que borraba rutinas legítimas que
 * comparten nombre pero ocurren a horas distintas (p.ej. "Tomar medicamentos"
 * a las 09:00, 15:00, 19:00 y 21:00 — 4 series, no 4 duplicados).
 *
 * La clave combina título + hora (HH:mm) del due_date. Dos instancias solo se
 * consideran de la misma serie si coinciden en título Y hora, que es justo lo
 * que se repite día a día.
 */
function seriesKey(task: Task): string {
  const time =
    task.due_date && task.due_date.includes('T')
      ? task.due_date.split('T')[1].slice(0, 5)
      : '';
  return `${task.title}@@${time}`;
}

/** Reconstruye un due_date para `dayKey` conservando la hora del template. */
function dueDateForDay(templateDueDate: string | undefined, dayKey: string): string {
  if (templateDueDate?.includes('T')) {
    return `${dayKey}T${templateDueDate.split('T')[1]}`;
  }
  return dayKey;
}

/** Construye el DTO de una instancia a partir de un template (raíz o subtarea). */
function instanceFromTemplate(
  template: Task,
  parentId: string | null,
  dayKey: string
): CreateTaskDTO {
  return {
    parent_id: parentId,
    title: template.title,
    description: template.description,
    status: 'pending',
    priority: template.priority,
    task_type: template.task_type,
    due_date: dueDateForDay(template.due_date, dayKey),
    weight: template.weight,
    repeat_days: template.repeat_days,
    hide_from_calendar: template.hide_from_calendar,
    tags: template.tags,
    is_synced: false,
  };
}

/**
 * Elimina duplicados reales de hoy: misma SERIE (título + hora) y mismo día.
 * Conserva la instancia más antigua de cada serie. Retorna true si eliminó algo.
 */
async function deduplicateToday(
  tasks: Task[],
  deleteTask: (id: string) => Promise<void>
): Promise<boolean> {
  const today = localDayKey();
  let madeChanges = false;

  const rootRoutinesToday = tasks.filter(
    (t) =>
      !t.parent_id &&
      (t.task_type === 'routine' || t.task_type === 'habit_group') &&
      t.due_date &&
      dayKeyOf(t.due_date) === today
  );

  // Agrupar por clave de serie (no por título).
  const byKey = new Map<string, Task[]>();
  for (const t of rootRoutinesToday) {
    const k = seriesKey(t);
    const list = byKey.get(k) ?? [];
    list.push(t);
    byKey.set(k, list);
  }

  for (const [, instances] of byKey) {
    if (instances.length <= 1) continue;
    // Conservar la más antigua → eliminar el resto (duplicados reales).
    instances.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const dup of instances.slice(1)) {
      const subs = tasks.filter((t) => t.parent_id === dup.id);
      for (const sub of subs) await deleteTask(sub.id);
      await deleteTask(dup.id);
      madeChanges = true;
    }
  }

  return madeChanges;
}

/**
 * Procesa las tareas rutinarias (rutinas y grupos de hábitos con repeat_days):
 * 0. Repara duplicados de hoy (siempre, para sanear estado previo).
 * 1. Guarda — solo crea/borra una vez por día (flag en localStorage).
 * 2. Elimina instancias de días anteriores.
 * 3. Crea la instancia de hoy (con sus subtareas) si corresponde por repeat_days.
 *
 * Retorna true si se hicieron cambios (para que el caller recargue).
 */
export async function processDailyRoutines(
  tasks: Task[],
  addTask: (dto: CreateTaskDTO) => Promise<Task>,
  _updateTask: (dto: UpdateTaskDTO) => Promise<void>,
  deleteTask: (id: string) => Promise<void>
): Promise<boolean> {
  // ─── Paso 0: reparar duplicados de hoy (corre siempre) ──────────────────────
  let madeChanges = await deduplicateToday(tasks, deleteTask);

  // ─── Paso 1: guardia — ya procesamos hoy ────────────────────────────────────
  if (alreadyProcessedToday()) {
    return madeChanges;
  }

  const now = new Date();
  const todayStr = localDayKey(now);
  const currentDayOfWeek = now.getDay(); // 0=dom … 6=sáb

  // ─── Paso 2: rutinas raíz recurrentes ───────────────────────────────────────
  const rootRoutines = tasks.filter(
    (t) =>
      !t.parent_id &&
      (t.task_type === 'routine' || t.task_type === 'habit_group') &&
      t.repeat_days &&
      t.repeat_days.length > 0
  );

  // Agrupar por SERIE (título + hora), no por título.
  const routinesByKey = new Map<string, Task[]>();
  for (const t of rootRoutines) {
    const k = seriesKey(t);
    const list = routinesByKey.get(k) ?? [];
    list.push(t);
    routinesByKey.set(k, list);
  }

  // ─── Paso 3: por cada serie ──────────────────────────────────────────────────
  for (const [, instances] of routinesByKey) {
    const todayInstances = instances.filter(
      (t) => t.due_date && dayKeyOf(t.due_date) === todayStr
    );
    const oldInstances = instances.filter(
      (t) => t.due_date && dayKeyOf(t.due_date) < todayStr
    );

    // 3a. Eliminar instancias de días anteriores NO completadas. Las completadas
    //     se conservan como historial (las usa el progreso semanal por completed_at).
    for (const old of oldInstances) {
      if (old.status === 'completed') continue;
      const oldSubs = tasks.filter((t) => t.parent_id === old.id);
      for (const sub of oldSubs) await deleteTask(sub.id);
      await deleteTask(old.id);
      madeChanges = true;
    }

    // 3b. Si ya existe la instancia de hoy, no duplicar.
    if (todayInstances.length > 0) continue;

    // 3c. Template = la instancia más reciente de la serie.
    const template = [...instances].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    if (!template) continue;

    // 3d. ¿Debe repetir hoy según repeat_days?
    if (!(template.repeat_days?.includes(currentDayOfWeek) ?? false)) continue;

    // 3e. Crear la instancia raíz de hoy.
    const newRoot = await addTask(instanceFromTemplate(template, null, todayStr));

    // 3f. Clonar subtareas del template.
    const templateSubs = tasks.filter((t) => t.parent_id === template.id);
    for (const sub of templateSubs) {
      await addTask(instanceFromTemplate(sub, newRoot.id, todayStr));
    }
    madeChanges = true;
  }

  // ─── Paso 4: marcar procesado hoy ───────────────────────────────────────────
  markProcessedToday();
  return madeChanges;
}
