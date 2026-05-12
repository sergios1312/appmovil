import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

/**
 * Procesa las tareas rutinarias:
 * 1. Cancela las rutinas de días anteriores que no se cumplieron (pending/in_progress).
 * 2. Si ya existen rutinas para hoy, no hace nada.
 * 3. Si no existen rutinas para hoy, clona las más recientes para el día actual.
 *
 * Retorna true si se hicieron cambios (para que el caller haga reload).
 */
export async function processDailyRoutines(
  tasks: Task[],
  addTask: (dto: CreateTaskDTO) => Promise<Task>,
  updateTask: (dto: UpdateTaskDTO) => Promise<void>,
  deleteTask: (id: string) => Promise<void>
): Promise<boolean> {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' local
  const currentDayOfWeek = now.getDay(); // 0=dom, 1=lun, ... 6=sáb

  let madeChanges = false;

  // ─── 1. Identificar tareas raíz rutinarias ─────────────────────────────────
  const rootRoutines = tasks.filter(
    (t) =>
      !t.parent_id &&
      (t.task_type === 'routine' || t.task_type === 'habit_group') &&
      t.repeat_days &&
      t.repeat_days.length > 0
  );

  // Agrupar por título para encontrar las "más recientes" de cada rutina
  const routinesByTitle = new Map<string, Task[]>();
  for (const t of rootRoutines) {
    const list = routinesByTitle.get(t.title) || [];
    list.push(t);
    routinesByTitle.set(t.title, list);
  }

  // ─── 2. Para cada rutina (agrupada por título) ──────────────────────────────
  for (const [title, instances] of routinesByTitle) {
    // Separar: instancias de hoy vs. anteriores
    const todayInstances = instances.filter(
      (t) => t.due_date && t.due_date.split('T')[0] === todayStr
    );
    const oldInstances = instances.filter(
      (t) => t.due_date && t.due_date.split('T')[0] < todayStr
    );

    // 2a. Cancelar/eliminar instancias anteriores no cumplidas
    for (const old of oldInstances) {
      // Eliminar las antiguas directamente en vez de cancelarlas (no queremos que se muestren)
      const oldSubs = tasks.filter((t) => t.parent_id === old.id);
      for (const sub of oldSubs) {
        await deleteTask(sub.id);
        madeChanges = true;
      }
      await deleteTask(old.id);
      madeChanges = true;
    }

    // 2b. Si ya hay instancia de hoy, no crear duplicados
    if (todayInstances.length > 0) continue;

    // 2c. Determinar si debe repetir hoy según repeat_days
    // Tomamos la primera instancia como plantilla (la más reciente)
    const sorted = instances.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const template = sorted[0];
    if (!template) continue;

    const shouldRepeatToday = template.repeat_days?.includes(currentDayOfWeek) ?? false;
    if (!shouldRepeatToday) continue;

    // 2d. Crear nueva instancia para hoy
    let newDueDate = todayStr;
    if (template.due_date && template.due_date.includes('T')) {
      const timePart = template.due_date.split('T')[1];
      newDueDate = `${todayStr}T${timePart}`;
    }

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

    // 2e. Clonar subtareas
    const templateSubs = tasks.filter((t) => t.parent_id === template.id);
    for (const sub of templateSubs) {
      let subDue = todayStr;
      if (sub.due_date && sub.due_date.includes('T')) {
        const tp = sub.due_date.split('T')[1];
        subDue = `${todayStr}T${tp}`;
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

  return madeChanges;
}
