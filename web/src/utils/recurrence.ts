import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

const RECURRENCE_KEY = 'taskflow_recurrence_date';

/**
 * Verifica si la recurrencia diaria ya fue procesada hoy.
 * Usa localStorage para evitar duplicados por múltiples cargas/renders.
 */
function alreadyProcessedToday(): boolean {
  const today = new Date().toLocaleDateString('en-CA');
  return localStorage.getItem(RECURRENCE_KEY) === today;
}

function markProcessedToday(): void {
  const today = new Date().toLocaleDateString('en-CA');
  localStorage.setItem(RECURRENCE_KEY, today);
}

/**
 * Elimina tareas duplicadas de hoy (mismo título, mismo tipo de raíz, mismo día).
 * Conserva solo la instancia más antigua de hoy para cada título.
 * Retorna true si eliminó algo.
 */
async function deduplicateToday(
  tasks: Task[],
  deleteTask: (id: string) => Promise<void>
): Promise<boolean> {
  const today = new Date().toLocaleDateString('en-CA');
  let madeChanges = false;

  const rootRoutines = tasks.filter(
    (t) =>
      !t.parent_id &&
      (t.task_type === 'routine' || t.task_type === 'habit_group') &&
      t.due_date?.split('T')[0] === today
  );

  // Agrupar por título
  const byTitle = new Map<string, Task[]>();
  for (const t of rootRoutines) {
    const list = byTitle.get(t.title) ?? [];
    list.push(t);
    byTitle.set(t.title, list);
  }

  for (const [, instances] of byTitle) {
    if (instances.length <= 1) continue;
    // Ordenar por created_at, más antigua primero → conservar la [0]
    instances.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const toDelete = instances.slice(1); // Eliminar las más nuevas (duplicados)
    for (const dup of toDelete) {
      const subs = tasks.filter((t) => t.parent_id === dup.id);
      for (const sub of subs) {
        await deleteTask(sub.id);
      }
      await deleteTask(dup.id);
      madeChanges = true;
    }
  }

  return madeChanges;
}

/**
 * Procesa las tareas rutinarias:
 * 1. Solo se ejecuta UNA VEZ por día (guarda flag en localStorage).
 * 2. Elimina rutinas de días anteriores de la BD.
 * 3. Crea instancias de hoy para las que corresponda por repeat_days.
 *
 * Retorna true si se hicieron cambios (para reload).
 */
export async function processDailyRoutines(
  tasks: Task[],
  addTask: (dto: CreateTaskDTO) => Promise<Task>,
  updateTask: (dto: UpdateTaskDTO) => Promise<void>,
  deleteTask: (id: string) => Promise<void>
): Promise<boolean> {
  // ─── Paso 0: Limpiar duplicados de hoy (si los hay por bug previo) ──────────
  // Esto siempre corre, sin importar el flag, para reparar el estado actual
  let madeChanges = await deduplicateToday(tasks, deleteTask);

  // ─── Paso 1: Guardia — ya procesamos hoy ────────────────────────────────────
  if (alreadyProcessedToday()) {
    return madeChanges;
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const currentDayOfWeek = now.getDay(); // 0=dom, 1=lun, ... 6=sáb

  // ─── Paso 2: Identificar tareas raíz rutinarias ─────────────────────────────
  const rootRoutines = tasks.filter(
    (t) =>
      !t.parent_id &&
      (t.task_type === 'routine' || t.task_type === 'habit_group') &&
      t.repeat_days &&
      t.repeat_days.length > 0
  );

  // Agrupar por título
  const routinesByTitle = new Map<string, Task[]>();
  for (const t of rootRoutines) {
    const list = routinesByTitle.get(t.title) ?? [];
    list.push(t);
    routinesByTitle.set(t.title, list);
  }

  // ─── Paso 3: Para cada rutina ────────────────────────────────────────────────
  for (const [, instances] of routinesByTitle) {
    const todayInstances = instances.filter(
      (t) => t.due_date?.split('T')[0] === todayStr
    );
    const oldInstances = instances.filter(
      (t) => t.due_date && t.due_date.split('T')[0] < todayStr
    );

    // 3a. Eliminar instancias de días anteriores de la BD
    for (const old of oldInstances) {
      const oldSubs = tasks.filter((t) => t.parent_id === old.id);
      for (const sub of oldSubs) await deleteTask(sub.id);
      await deleteTask(old.id);
      madeChanges = true;
    }

    // 3b. Si ya hay instancia de hoy, no crear duplicados
    if (todayInstances.length > 0) continue;

    // 3c. Obtener plantilla (la más reciente de cualquier día)
    const sorted = [...instances].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const template = sorted[0];
    if (!template) continue;

    // 3d. Verificar si debe repetir hoy
    const shouldRepeatToday = template.repeat_days?.includes(currentDayOfWeek) ?? false;
    if (!shouldRepeatToday) continue;

    // 3e. Construir due_date de hoy con la misma hora
    let newDueDate = todayStr;
    if (template.due_date?.includes('T')) {
      const timePart = template.due_date.split('T')[1];
      newDueDate = `${todayStr}T${timePart}`;
    }

    // 3f. Crear nueva instancia raíz para hoy
    const newRoot = await addTask({
      parent_id: null,
      title: template.title,
      description: template.description,
      status: 'pending',
      priority: template.priority,
      task_type: template.task_type,
      due_date: newDueDate,
      weight: template.weight,
      repeat_days: template.repeat_days,
      hide_from_calendar: template.hide_from_calendar,
      tags: template.tags,
      is_synced: false,
    } as any);

    // 3g. Clonar subtareas
    const templateSubs = tasks.filter((t) => t.parent_id === template.id);
    for (const sub of templateSubs) {
      let subDue = todayStr;
      if (sub.due_date?.includes('T')) {
        subDue = `${todayStr}T${sub.due_date.split('T')[1]}`;
      }
      await addTask({
        parent_id: newRoot.id,
        title: sub.title,
        description: sub.description,
        status: 'pending',
        priority: sub.priority,
        task_type: sub.task_type,
        due_date: subDue,
        weight: sub.weight,
        repeat_days: sub.repeat_days,
        hide_from_calendar: sub.hide_from_calendar,
        tags: sub.tags,
        is_synced: false,
      } as any);
    }
    madeChanges = true;
  }

  // ─── Paso 4: Marcar como procesado hoy ─────────────────────────────────────
  markProcessedToday();
  return madeChanges;
}
