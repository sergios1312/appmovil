import { Task, CreateTaskDTO, UpdateTaskDTO } from '@/core/entities/Task';

/**
 * Procesa las tareas rutinarias atrasadas:
 * 1. Marca las no cumplidas de días anteriores como 'cancelled'.
 * 2. Crea nuevas instancias para el día de hoy si corresponde según repeat_days.
 */
export async function processDailyRoutines(
  tasks: Task[],
  addTask: (dto: CreateTaskDTO) => Promise<Task>,
  updateTask: (dto: UpdateTaskDTO) => Promise<void>
) {
  const now = new Date();
  // Fecha actual en formato YYYY-MM-DD
  const todayStr = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' en zona local
  const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, ...

  // Buscar tareas raíz (sin parent_id) que sean rutinarias y de días anteriores
  const rootRoutines = tasks.filter(
    (t) => !t.parent_id && (t.task_type === 'routine' || t.task_type === 'habit_group') && t.due_date && t.due_date.split('T')[0] < todayStr
  );

  for (const oldRoot of rootRoutines) {
    // Si la tarea se debe repetir hoy
    const shouldRepeatToday = oldRoot.repeat_days?.includes(currentDayOfWeek) ?? true;
    
    // Si no se cumplió, la marcamos como no cumplida (cancelada)
    if (oldRoot.status === 'pending' || oldRoot.status === 'in_progress') {
      await updateTask({ id: oldRoot.id, status: 'cancelled' });
    }
    
    // Obtener sus subtareas antiguas
    const oldSubtasks = tasks.filter((t) => t.parent_id === oldRoot.id);
    for (const oldSub of oldSubtasks) {
      if (oldSub.status === 'pending' || oldSub.status === 'in_progress') {
        await updateTask({ id: oldSub.id, status: 'cancelled' });
      }
    }

    if (shouldRepeatToday) {
      // Extraer solo la hora de la fecha original, si la tiene
      let newDueDate = todayStr;
      if (oldRoot.due_date && oldRoot.due_date.includes('T')) {
        const timePart = oldRoot.due_date.split('T')[1];
        newDueDate = `${todayStr}T${timePart}`;
      }

      // Crear nueva tarea raíz
      const newRoot = await addTask({
        parent_id: null,
        title: oldRoot.title,
        description: oldRoot.description,
        status: 'pending',
        priority: oldRoot.priority,
        task_type: oldRoot.task_type,
        due_date: newDueDate,
        weight: oldRoot.weight,
        repeat_days: oldRoot.repeat_days,
        hide_from_calendar: oldRoot.hide_from_calendar,
        tags: oldRoot.tags,
        is_synced: false,
        user_id: oldRoot.user_id, // Asegurar que pase el user_id
      } as any);

      // Crear nuevas subtareas vinculadas al nuevo padre
      for (const oldSub of oldSubtasks) {
        let subDueDate = todayStr;
        if (oldSub.due_date && oldSub.due_date.includes('T')) {
          const timePart = oldSub.due_date.split('T')[1];
          subDueDate = `${todayStr}T${timePart}`;
        }
        await addTask({
          parent_id: newRoot.id,
          title: oldSub.title,
          description: oldSub.description,
          status: 'pending',
          priority: oldSub.priority,
          task_type: oldSub.task_type,
          due_date: subDueDate,
          weight: oldSub.weight,
          repeat_days: oldSub.repeat_days,
          hide_from_calendar: oldSub.hide_from_calendar,
          tags: oldSub.tags,
          is_synced: false,
          user_id: oldSub.user_id,
        } as any);
      }
    }
  }
}
