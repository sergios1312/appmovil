import type { CreateTaskDTO, Task } from '@/core/entities/Task';
import { localDayKey } from '@/utils/dateHelpers';

type AddTask = (dto: CreateTaskDTO) => Promise<Task>;

/**
 * Crea un set de rutinas diarias de ejemplo.
 * El user_id lo asigna el repositorio, por eso ya no se pasa aquí.
 * due_date se guarda en hora local (sin Z), coherente con el resto de la app.
 */
export async function seedDailyRoutines(addTask: AddTask) {
  const today = localDayKey();
  const daily = [0, 1, 2, 3, 4, 5, 6];
  const monToSat = [1, 2, 3, 4, 5, 6];

  const base = {
    status: 'pending' as const,
    priority: 'high' as const,
    parent_id: null,
    is_synced: false,
    hide_from_calendar: false,
  };

  // 1. Gimnasio
  await addTask({
    ...base,
    title: 'Gimnasio',
    task_type: 'routine',
    due_date: `${today}T12:00:00`,
    weight: 5,
    repeat_days: monToSat,
  });

  // 2. Rutina de la mañana (grupo de hábitos)
  const morning = await addTask({
    ...base,
    title: 'Rutina de la mañana',
    task_type: 'habit_group',
    due_date: `${today}T09:00:00`,
    weight: 3,
    repeat_days: daily,
  });
  await addTask({ ...base, title: 'Lavarse los dientes', task_type: 'routine', due_date: `${today}T09:00:00`, weight: 1, repeat_days: daily, hide_from_calendar: true, parent_id: morning.id });
  await addTask({ ...base, title: 'Tomar medicamento', task_type: 'routine', due_date: `${today}T09:00:00`, weight: 2, repeat_days: daily, hide_from_calendar: true, parent_id: morning.id });

  // 3. Rutina de la tarde (grupo de hábitos)
  const afternoon = await addTask({
    ...base,
    title: 'Rutina de la tarde',
    task_type: 'habit_group',
    due_date: `${today}T15:00:00`,
    weight: 3,
    repeat_days: daily,
  });
  await addTask({ ...base, title: 'Cepillarse los dientes', task_type: 'routine', due_date: `${today}T15:00:00`, weight: 1, repeat_days: daily, hide_from_calendar: true, parent_id: afternoon.id });
  await addTask({ ...base, title: 'Tomar medicamentos', task_type: 'routine', due_date: `${today}T15:00:00`, weight: 2, repeat_days: daily, hide_from_calendar: true, parent_id: afternoon.id });

  // 4. Tomar medicamentos (noche)
  await addTask({ ...base, title: 'Tomar medicamentos', task_type: 'routine', due_date: `${today}T19:00:00`, weight: 2, repeat_days: daily });

  // 5. Hacer ejercicio
  await addTask({ ...base, title: 'Hacer ejercicio', task_type: 'routine', due_date: `${today}T19:30:00`, weight: 4, repeat_days: daily, priority: 'medium' });

  // 6. Rutina de la noche (grupo de hábitos)
  const night = await addTask({
    ...base,
    title: 'Rutina de la noche',
    task_type: 'habit_group',
    due_date: `${today}T21:00:00`,
    weight: 3,
    repeat_days: daily,
  });
  await addTask({ ...base, title: 'Tomar medicamentos', task_type: 'routine', due_date: `${today}T21:00:00`, weight: 2, repeat_days: daily, hide_from_calendar: true, parent_id: night.id });
  await addTask({ ...base, title: 'Cepillarse los dientes', task_type: 'routine', due_date: `${today}T21:00:00`, weight: 1, repeat_days: daily, hide_from_calendar: true, parent_id: night.id });
}
